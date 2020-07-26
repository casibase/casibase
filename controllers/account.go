// Copyright 2020 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package controllers

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"sync"

	"golang.org/x/oauth2"

	"github.com/aliyun/aliyun-sts-go-sdk/sts"
	"github.com/astaxie/beego"

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

type SignupForm struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
	Method   string `json:"method"`
	Addition string `json:"addition"`
}

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

// @Title Signup
// @Description sign up a new member
// @Param   username     formData    string  true        "The username to sign up"
// @Param   password     formData    string  true        "The password"
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signup [post]
func (c *APIController) Signup() {
	var resp Response

	if c.GetSessionUser() != "" {
		resp = Response{Status: "error", Msg: "errorSignoutBeforeSignup", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var form SignupForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}
	member, password, email, avatar := form.Username, form.Password, form.Email, form.Avatar

	checkUserName := object.UserNamingRestrictions
	if checkUserName {
		if !util.IsValidUsername(member) {
			resp = Response{Status: "error", Msg: "you could just have digital, letter and underline in you name", Data: ""}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
	}

	var msg string
	if password == "" && email != "" {
		msg = object.CheckMemberSignupWithEmail(member, email)
	} else {
		msg = object.CheckMemberSignup(member, password)
	}

	if msg != "" {
		resp = Response{Status: "error", Msg: msg, Data: ""}
	} else {
		no := object.GetMemberNum()
		member := &object.Member{
			Id:          member,
			No:          no + 1,
			Password:    password,
			Email:       email,
			Avatar:      avatar,
			IsModerator: false,
			CreatedTime: util.GetCurrentTime(),
		}
		switch form.Method {
		case "google":
			member.GoogleAccount = form.Addition
			break
		case "github":
			member.GithubAccount = form.Addition
			break
		}

		object.AddMember(member)

		c.SetSessionUser(member.Id)

		util.LogInfo(c.Ctx, "API: [%s] is signed up as new member", member)
		resp = Response{Status: "ok", Msg: "success", Data: member}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title Signin
// @Description sign in as a member
// @Param   username     formData    string  true        "The username to sign in"
// @Param   password     formData    string  true        "The password"
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signin [post]
func (c *APIController) Signin() {
	var resp Response

	if c.GetSessionUser() != "" {
		resp = Response{Status: "error", Msg: "errorSignoutBeforeSignin", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var form SignupForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}

	var msg string
	var member string
	var password string
	member, password = form.Username, form.Password
	msg = object.CheckMemberLogin(member, password)

	if msg != "" {
		resp = Response{Status: "error", Msg: msg, Data: ""}
	} else {
		c.SetSessionUser(member)

		util.LogInfo(c.Ctx, "API: [%s] signed in", member)
		resp = Response{Status: "ok", Msg: "success", Data: member}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title Signout
// @Description sign out the current member
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signout [post]
func (c *APIController) Signout() {
	var resp Response

	member := c.GetSessionUser()
	util.LogInfo(c.Ctx, "API: [%s] signed out", member)

	c.SetSessionUser("")

	resp = Response{Status: "ok", Msg: "success", Data: member}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetAccount() {
	var resp Response

	if c.GetSessionUser() == "" {
		resp = Response{Status: "error", Msg: "errorSigninFirst", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var memberObj interface{}
	username := c.GetSessionUser()
	memberObj = object.GetMember(username)
	resp = Response{Status: "ok", Msg: "", Data: util.StructToJson(memberObj)}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetSessionId() {
	c.Data["json"] = c.StartSession().SessionID()
	c.ServeJSON()
}

var googleEndpoint = oauth2.Endpoint{
	AuthURL:  "https://accounts.google.com/o/oauth2/auth",
	TokenURL: "https://accounts.google.com/o/oauth2/token",
}

var googleOauthConfig = &oauth2.Config{
	ClientID:     beego.AppConfig.String("GoogleAuthClientID"),
	ClientSecret: beego.AppConfig.String("GoogleAuthClientSecret"),
	RedirectURL:  "",
	Scopes:       []string{"profile", "email"},
	Endpoint:     googleEndpoint,
}

//Using addition to judge signup or link
func (c *APIController) AuthGoogle() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")
	addition := c.Input().Get("addition")
	RedirectURL := c.Input().Get("redirect_url")

	var resp Response
	var res authResponse
	res.IsAuthenticated = true

	if state != beego.AppConfig.String("GoogleAuthState") {
		res.IsAuthenticated = false
		resp = Response{Status: "fail", Msg: "unauthorized", Data: res}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	googleOauthConfig.RedirectURL = RedirectURL

	// https://github.com/golang/oauth2/issues/123#issuecomment-103715338
	ctx := context.WithValue(oauth2.NoContext, oauth2.HTTPClient, httpClient)
	token, err := googleOauthConfig.Exchange(ctx, code)
	if err != nil {
		res.IsAuthenticated = false
		panic(err)
	}

	response, err := httpClient.Get("https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=" + token.AccessToken)
	defer response.Body.Close()
	contents, err := ioutil.ReadAll(response.Body)

	var tempUser userInfoFromGoogle
	err = json.Unmarshal(contents, &tempUser)
	if err != nil {
		res.IsAuthenticated = false
		panic(err)
	}
	res.Email = tempUser.Email
	res.Avatar = tempUser.Picture

	if addition == "signup" {
		userId := object.HasGoogleAccount(res.Email)
		if userId != "" {
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			if userId := object.HasMail(res.Email); userId != "" {
				c.SetSessionUser(userId)
				util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
				res.IsSignedUp = true
				_ = object.LinkMemberAccount(userId, "google_account", tempUser.Email)
			} else {
				res.IsSignedUp = false
			}
		}
		res.Addition = res.Email
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		memberId := c.GetSessionUser()
		if memberId == "" {
			resp = Response{Status: "fail", Msg: "no account exist", Data: res}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
		linkRes := object.LinkMemberAccount(memberId, "google_account", res.Email)
		if linkRes {
			resp = Response{Status: "ok", Msg: "success", Data: linkRes}
		} else {
			resp = Response{Status: "fail", Msg: "link account failed", Data: linkRes}
		}
		if len(object.GetMemberAvatar(memberId)) == 0 {
			object.LinkMemberAccount(memberId, "avatar", res.Avatar)
		}
	}

	c.Data["json"] = resp

	c.ServeJSON()
}

var githubEndpoint = oauth2.Endpoint{
	AuthURL:  "https://github.com/login/oauth/authorize",
	TokenURL: "https://github.com/login/oauth/access_token",
}

var githubOauthConfig = &oauth2.Config{
	ClientID:     beego.AppConfig.String("GithubAuthClientID"),
	ClientSecret: beego.AppConfig.String("GithubAuthClientSecret"),
	RedirectURL:  "",
	Scopes:       []string{"user:email", "read:user"},
	Endpoint:     githubEndpoint,
}

func (c *APIController) AuthGithub() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")
	addition := c.Input().Get("addition")
	RedirectURL := c.Input().Get("redirect_url")

	var resp Response
	var res authResponse
	res.IsAuthenticated = true

	if state != beego.AppConfig.String("GithubAuthState") {
		res.IsAuthenticated = false
		resp = Response{Status: "fail", Msg: "unauthorized", Data: res}
		c.ServeJSON()
		return
	}

	githubOauthConfig.RedirectURL = RedirectURL

	// https://github.com/golang/oauth2/issues/123#issuecomment-103715338
	ctx := context.WithValue(oauth2.NoContext, oauth2.HTTPClient, httpClient)
	token, err := githubOauthConfig.Exchange(ctx, code)
	if err != nil {
		res.IsAuthenticated = false
		panic(err)
	}

	if !token.Valid() {
		resp = Response{Status: "fail", Msg: "unauthorized", Data: res}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var wg sync.WaitGroup
	var tempUserEmail []userEmailFromGithub
	var tempUserAccount userInfoFromGithub
	wg.Add(2)
	go func() {
		response, err := httpClient.Get("https://api.github.com/user/emails?access_token=" + token.AccessToken)
		if err != nil {
			panic(err)
		}
		defer response.Body.Close()
		contents, err := ioutil.ReadAll(response.Body)

		err = json.Unmarshal(contents, &tempUserEmail)
		if err != nil {
			res.IsAuthenticated = false
			panic(err)
		}
		for _, v := range tempUserEmail {
			if v.Primary == true {
				res.Email = v.Email
				break
			}
		}
		wg.Done()
	}()
	go func() {
		response2, err := httpClient.Get("https://api.github.com/user?access_token=" + token.AccessToken)
		if err != nil {
			panic(err)
		}
		defer response2.Body.Close()
		contents2, err := ioutil.ReadAll(response2.Body)
		err = json.Unmarshal(contents2, &tempUserAccount)
		if err != nil {
			res.IsAuthenticated = false
			panic(err)
		}
		wg.Done()
	}()
	wg.Wait()

	if addition == "signup" {
		userId := object.HasGithubAccount(tempUserAccount.Login)
		if userId != "" {
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			if userId := object.HasMail(res.Email); userId != "" {
				c.SetSessionUser(userId)
				util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
				res.IsSignedUp = true
				_ = object.LinkMemberAccount(userId, "github_account", tempUserAccount.Login)
			} else {
				res.IsSignedUp = false
			}
		}
		res.Addition = tempUserAccount.Login
		res.Avatar = tempUserAccount.AvatarUrl
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		memberId := c.GetSessionUser()
		if memberId == "" {
			resp = Response{Status: "fail", Msg: "no account exist", Data: res}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
		linkRes := object.LinkMemberAccount(memberId, "github_account", tempUserAccount.Login)
		if linkRes {
			resp = Response{Status: "ok", Msg: "success", Data: linkRes}
		} else {
			resp = Response{Status: "fail", Msg: "link account failed", Data: linkRes}
		}
		if len(object.GetMemberAvatar(memberId)) == 0 {
			object.LinkMemberAccount(memberId, "avatar", tempUserAccount.AvatarUrl)
		}
	}

	c.Data["json"] = resp

	c.ServeJSON()
}

var accessKeyID = beego.AppConfig.String("accessKeyID")
var accessKeySecret = beego.AppConfig.String("accessKeySecret")
var roleArn = beego.AppConfig.String("roleArn")

func (c *APIController) GetMemberStsToken() {
	sessionName := c.GetSessionUser()
	stsClient := sts.NewClient(accessKeyID, accessKeySecret, roleArn, sessionName)

	authResp, err := stsClient.AssumeRole(3600)
	if err != nil {
		panic(err)
	}

	res := stsTokenResponse{
		AccessKeyID:     authResp.Credentials.AccessKeyId,
		AccessKeySecret: authResp.Credentials.AccessKeySecret,
		StsToken:        authResp.Credentials.SecurityToken,
	}

	var resp Response
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp

	c.ServeJSON()
}
