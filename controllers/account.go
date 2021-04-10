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
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"

	"golang.org/x/oauth2"

	"github.com/astaxie/beego"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

type SignupForm struct {
	Username       string `json:"username"`
	Password       string `json:"password"`
	Email          string `json:"email"`
	Avatar         string `json:"avatar"`
	Method         string `json:"method"`
	Phone          string `json:"phone"`
	AreaCode       string `json:"areaCode"` // phone area code
	Company        string `json:"company"`
	CompanyTitle   string `json:"companyTitle"`
	Location       string `json:"location"`
	ValidateCode   string `json:"validateCode"`
	ValidateCodeId string `json:"validateCodeId"`
	Addition       string `json:"addition"`
	Addition2      string `json:"addition2"` // this field is for more addition info if needed
}

// SigninForm information field could be phone number, username or email.
type SigninForm struct {
	Information string `json:"information"`
	Password    string `json:"password"`
	Email       string `json:"email"`
	Captcha     string `json:"captcha"`
	CaptchaId   string `json:"captchaId"`
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
		resp = Response{Status: "error", Msg: "Please sign out before sign up", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var form SignupForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}

	if len(form.Password) == 0 {
		resp = Response{Status: "error", Msg: "Password empty"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if strings.Index(form.Password, " ") >= 0 {
		resp = Response{Status: "error", Msg: "Password contains space"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if form.Method != "google" && form.Method != "github" && form.Method != "qq" && form.Method != "wechat" {
		// Check validate code.
		var validateCodeRes bool
		if form.Method == "phone" {
			validateCodeRes = object.VerifyValidateCode(form.ValidateCodeId, form.ValidateCode, form.Phone)
		} else {
			validateCodeRes = object.VerifyValidateCode(form.ValidateCodeId, form.ValidateCode, form.Email)
		}
		if !validateCodeRes {
			resp = Response{Status: "error", Msg: "validate code error", Data: ""}
			if object.CheckValidateCodeExpired(form.ValidateCodeId) {
				resp = Response{Status: "error", Msg: "validate code expired", Data: ""}
			}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
	}

	member, password, email, avatar := form.Username, form.Password, form.Email, form.Avatar

	if object.HasMember(member) {
		resp = Response{Status: "error", Msg: "Member already exists"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	checkUserName := object.UserNamingRestrictions
	if checkUserName {
		if !util.IsValidUsername(member) {
			resp = Response{Status: "error", Msg: "You can only use numbers, letters and underline in your username, and the length is between 4 and 20 characters", Data: ""}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
	}

	var msg string
	// Check the information registered through the github, google, email method.
	if (password == "" && email != "") || form.Method == "email" {
		if password != "" {
			msg = object.CheckMemberSignup(member, password)
		}
		msg = object.CheckMemberSignupWithEmail(member, email)
	} else {
		// Check the information registered through the phone method.
		if form.Method == "phone" {
			msg = object.CheckMemberSignup(member, password)
			if len(msg) == 0 {
				msg = object.CheckMemberSignupWithPhone(member, form.Phone)
			}
		} else if form.Method == "qq" {
			// Check the information registered through the qq method.
			msg = object.CheckMemberSignupWithQQ(member, form.Addition2)
		} else if form.Method == "wechat" {
			msg = object.CheckMemberSignupWithWeChat(member, form.Addition2)
		}
	}

	if msg != "" {
		resp = Response{Status: "error", Msg: msg, Data: ""}
	} else {
		if form.Method == "qq" || form.Method == "wechat" {
			avatar, err = url.QueryUnescape(avatar)
			if err != nil {
				panic(err)
			}
		}
		avatar = UploadAvatarToOSS(avatar, member)
		no := object.GetMemberNum()
		member := &object.Member{
			Id:           member,
			Password:     password,
			No:           no + 1,
			IsModerator:  false,
			CreatedTime:  util.GetCurrentTime(),
			Phone:        form.Phone,
			AreaCode:     form.AreaCode,
			Avatar:       avatar,
			Email:        email,
			Company:      form.Company,
			CompanyTitle: form.CompanyTitle,
			ScoreCount:   200,
			Location:     form.Location,
			FileQuota:    object.DefaultUploadFileQuota,
		}
		if no == 0 {
			member.IsModerator = true
		}
		switch form.Method {
		case "google":
			member.GoogleAccount = form.Addition
			if len(email) != 0 {
				member.EmailVerifiedTime = util.GetCurrentTime()
			}
			break
		case "github":
			member.GithubAccount = form.Addition
			if len(email) != 0 {
				member.EmailVerifiedTime = util.GetCurrentTime()
			}
			break
		case "phone":
			member.PhoneVerifiedTime = util.GetCurrentTime()
		case "email":
			member.EmailVerifiedTime = util.GetCurrentTime()
		case "qq":
			member.QQOpenId = form.Addition2
			member.QQAccount = form.Addition
			member.QQVerifiedTime = util.GetCurrentTime()
		case "wechat":
			member.WechatOpenId = form.Addition2
			member.WechatAccount = form.Addition
			member.WechatVerifiedTime = util.GetCurrentTime()
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
		resp = Response{Status: "error", Msg: "Please sign out before sign in", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var form SigninForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}

	verifyCaptchaRes := object.VerifyCaptcha(form.CaptchaId, form.Captcha)
	if !verifyCaptchaRes {
		resp = Response{Status: "error", Msg: "Captcha error"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	var information string
	var password string
	information, password = form.Information, form.Password
	member, msg := object.CheckMemberLogin(information, password)

	if msg != "" {
		resp = Response{Status: "error", Msg: msg, Data: ""}
	} else {
		// check account status
		if object.IsForbidden(member) {
			c.forbiddenAccountResp(member)
			return
		}

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
		resp = Response{Status: "error", Msg: "Please sign in first", Data: c.GetSessionUser()}
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

func (c *APIController) ResetPassword() {
	step := c.Input().Get("step")

	var resp Response
	switch step {
	case "1":
		var form getResetPasswordMember
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}

		verifyCaptchaRes := object.VerifyCaptcha(form.CaptchaId, form.Captcha)
		if !verifyCaptchaRes {
			resp = Response{Status: "error", Msg: "Captcha error"}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}

		date := util.GetTimeHour(-24)
		frequency := object.GetMemberResetFrequency(form.Username, date)
		if frequency >= 2 {
			resp = Response{Status: "error", Msg: "Reset password more than twice within 24 hours"}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}

		userInfo := object.GetMember(form.Username)
		if userInfo == nil {
			resp = Response{Status: "error", Msg: "Member not found"}
		} else {
			if len(userInfo.Phone) != 0 && len(userInfo.PhoneVerifiedTime) != 0 {
				//validateCodeId, code := object.GetNewValidateCode(userInfo.Phone)
				//service.SendSms(userInfo.Phone, code)
				resetInfo := resetPasswordPhoneResponse{
					Username: userInfo.Id,
					Phone:    "*******" + userInfo.Phone[len(userInfo.Phone)-4:],
					//ValidateCodeId: validateCodeId,
				}
				resp = Response{Status: "ok", Msg: "success", Data: "phone", Data2: resetInfo}
				if len(userInfo.Email) != 0 && len(userInfo.EmailVerifiedTime) != 0 {
					resp.Data = "both"
					break
				}
			} else {
				resp = Response{Status: "ok", Msg: "success", Data: "email"}
			}
		}
		break
	case "2": // phone
		var form resetPasswordWithPhone
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}

		userInfo := object.GetMember(form.Username)
		if form.Method != "phone" {
			resp = Response{Status: "error", Msg: "Please try again"}
		}

		verifyRes := object.VerifyValidateCode(form.ValidateCodeId, form.ValidateCode, userInfo.Phone)
		if verifyRes {
			resetId, resetCode := object.AddNewResetRecord(userInfo.Phone, form.Username, 1)
			res := verifyResetWithPhoneRes{
				Username:  form.Username,
				ResetId:   resetId,
				ResetCode: resetCode,
			}
			resp = Response{Status: "ok", Msg: "success", Data: "phone", Data2: res}
		} else {
			resp = Response{Status: "error", Msg: "Validate code error"}
		}
	case "3": // email
		var form resetPasswordWithEmail
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}

		userInfo := object.GetMember(form.Username)
		if form.Method != "email" {
			resp = Response{Status: "error", Msg: "Please try again"}
		}

		if userInfo.Email == form.Email {
			resetId, resetCode := object.AddNewResetRecord(userInfo.Email, form.Username, 2)
			idStr := util.IntToString(resetId)
			resetUrl := form.Url + "/forgot?method=email" + "&id=" + idStr + "&code=" + resetCode + "&username=" + userInfo.Id
			err := service.SendResetPasswordMail(userInfo.Email, userInfo.Id, resetUrl)
			if err != nil {
				resp = Response{Status: "error", Msg: "Send email fail"}
			}
			resp = Response{Status: "ok", Msg: "success", Data: "email", Data2: userInfo.Email}
		} else {
			resp = Response{Status: "error", Msg: "Email and account do not correspond"}
		}
	case "5": // verify
		var form resetPasswordVerify
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}

		var recordType int
		if form.Method == "phone" {
			recordType = 1
		} else if form.Method == "email" {
			recordType = 2
		}

		if len(form.Password) == 0 {
			resp = Response{Status: "error", Msg: "Password is empty"}
			break
		}

		if strings.Index(form.Password, " ") >= 0 {
			resp = Response{Status: "error", Msg: "Password contains space"}
			break
		}

		res := object.VerifyResetInformation(form.Id, form.Code, form.Username, recordType)
		if res {
			object.UpdateMemberPassword(form.Username, form.Password)
			resp = Response{Status: "ok", Msg: "success"}
		} else {
			resp = Response{Status: "error", Msg: "Please try again"}
			if object.CheckResetCodeExpired(form.Id) {
				resp = Response{Status: "error", Msg: "This password reset request has expired", Data: ""}
			}
		}
	case "7":
		var form resetPasswordValidateCode
		err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
		if err != nil {
			panic(err)
		}

		userInfo := object.GetMember(form.Username)
		if userInfo == nil {
			resp = Response{Status: "error", Msg: "Member not found"}
		} else {
			validateCodeId, code := object.GetNewValidateCode(userInfo.Phone)
			service.SendSms(userInfo.Phone, code)
			resp = Response{Status: "ok", Msg: "success", Data: validateCodeId}
		}
	default:
		resp = Response{Status: "error", Msg: "Please try again"}
	}

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

	if state != beego.AppConfig.String("AuthState") {
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

	if res.Email == "" {
		resp = Response{Status: "fail", Msg: "Login failed, please try again."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if addition == "signup" {
		userId := object.HasGoogleAccount(res.Email)
		if userId != "" {
			// check account status
			if object.IsForbidden(userId) {
				c.forbiddenAccountResp(userId)
				return
			}

			if len(object.GetMemberAvatar(userId)) == 0 {
				avatar := UploadAvatarToOSS(res.Avatar, userId)
				object.LinkMemberAccount(userId, "avatar", avatar)
			}
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			if userId := object.HasMail(res.Email); userId != "" {
				// check account status
				if object.IsForbidden(userId) {
					c.forbiddenAccountResp(userId)
					return
				}

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
			avatar := UploadAvatarToOSS(res.Avatar, memberId)
			object.LinkMemberAccount(memberId, "avatar", avatar)
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

	if state != beego.AppConfig.String("AuthState") {
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
		req, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		req.Header.Set("Authorization", "token "+token.AccessToken)
		response, err := httpClient.Do(req)
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
		req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
		req.Header.Set("Authorization", "token "+token.AccessToken)
		response2, err := httpClient.Do(req)
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

	if res.Email == "" || tempUserAccount.Login == "" {
		resp = Response{Status: "fail", Msg: "Login failed, please try again."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if addition == "signup" {
		userId := object.HasGithubAccount(tempUserAccount.Login)
		if userId != "" {
			// check account status
			if object.IsForbidden(userId) {
				c.forbiddenAccountResp(userId)
				return
			}

			if len(object.GetMemberAvatar(userId)) == 0 {
				avatar := UploadAvatarToOSS(tempUserAccount.AvatarUrl, userId)
				object.LinkMemberAccount(userId, "avatar", avatar)
			}
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			if userId := object.HasMail(res.Email); userId != "" {
				// check account status
				if object.IsForbidden(userId) {
					c.forbiddenAccountResp(userId)
					return
				}

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
			avatar := UploadAvatarToOSS(tempUserAccount.AvatarUrl, memberId)
			object.LinkMemberAccount(memberId, "avatar", avatar)
		}
	}

	c.Data["json"] = resp

	c.ServeJSON()
}

var QQClientID = beego.AppConfig.String("QQAPPID")
var QQClientSecret = beego.AppConfig.String("QQAPPKey")

func (c *APIController) AuthQQ() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")
	addition := c.Input().Get("addition")
	redirectURL := c.Input().Get("redirect_url")

	var resp Response
	var res authResponse
	res.IsAuthenticated = true

	if state != beego.AppConfig.String("AuthState") {
		res.IsAuthenticated = false
		resp = Response{Status: "fail", Msg: "unauthorized", Data: res}
		c.ServeJSON()
		return
	}

	params := url.Values{}
	params.Add("grant_type", "authorization_code")
	params.Add("client_id", QQClientID)
	params.Add("client_secret", QQClientSecret)
	params.Add("code", code)
	params.Add("redirect_uri", redirectURL)
	getAccessKeyUrl := fmt.Sprintf("%s?%s", "https://graph.qq.com/oauth2.0/token", params.Encode())

	tokenResponse, err := httpClient.Get(getAccessKeyUrl)
	if err != nil {
		panic(err)
	}
	defer tokenResponse.Body.Close()
	tokenContent, err := ioutil.ReadAll(tokenResponse.Body)

	tokenReg := regexp.MustCompile("token=(.*?)&")
	tokenRegRes := tokenReg.FindAllStringSubmatch(string(tokenContent), -1)
	token := tokenRegRes[0][1]

	getOpenIdUrl := fmt.Sprintf("https://graph.qq.com/oauth2.0/me?access_token=%s", token)

	openIdResponse, err := httpClient.Get(getOpenIdUrl)
	if err != nil {
		panic(err)
	}
	defer openIdResponse.Body.Close()
	openIdContent, err := ioutil.ReadAll(openIdResponse.Body)

	openIdReg := regexp.MustCompile("\"openid\":\"(.*?)\"}")
	openIdRegRes := openIdReg.FindAllStringSubmatch(string(openIdContent), -1)
	openId := openIdRegRes[0][1]

	getUserInfoUrl := fmt.Sprintf("https://graph.qq.com/user/get_user_info?access_token=%s&oauth_consumer_key=%s&openid=%s", token, QQClientID, openId)
	getUserInfoResponse, err := httpClient.Get(getUserInfoUrl)
	if err != nil {
		panic(err)
	}
	defer getUserInfoResponse.Body.Close()
	userInfoContent, err := ioutil.ReadAll(getUserInfoResponse.Body)
	var userInfo userInfoFromQQ
	err = json.Unmarshal(userInfoContent, &userInfo)
	if err != nil || userInfo.Ret != 0 {
		res.IsAuthenticated = false
		if err != nil {
			panic(err)
		}
	}

	if openId == "" {
		resp = Response{Status: "fail", Msg: "Login failed, please try again."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if addition == "signup" {
		userId := object.HasQQAccount(openId)
		if userId != "" {
			// check account status
			if object.IsForbidden(userId) {
				c.forbiddenAccountResp(userId)
				return
			}

			if len(object.GetMemberAvatar(userId)) == 0 {
				avatar := UploadAvatarToOSS(userInfo.AvatarUrl, userId)
				object.LinkMemberAccount(userId, "avatar", avatar)
			}
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			res.IsSignedUp = false
		}
		res.Addition = userInfo.Nickname
		res.Avatar = url.QueryEscape(userInfo.AvatarUrl)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: openId}
	} else {
		memberId := c.GetSessionUser()
		if memberId == "" {
			resp = Response{Status: "fail", Msg: "no account exist", Data: res}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
		linkRes := object.LinkMemberAccount(memberId, "qq_account", userInfo.Nickname)
		linkRes = object.LinkMemberAccount(memberId, "qq_open_id", openId)
		linkRes = object.LinkMemberAccount(memberId, "qq_verified_time", util.GetCurrentTime())
		if linkRes {
			resp = Response{Status: "ok", Msg: "success", Data: linkRes}
		} else {
			resp = Response{Status: "fail", Msg: "link account failed", Data: linkRes}
		}
		if len(object.GetMemberAvatar(memberId)) == 0 {
			avatar := UploadAvatarToOSS(userInfo.AvatarUrl, memberId)
			object.LinkMemberAccount(memberId, "avatar", avatar)
		}
	}

	c.Data["json"] = resp

	c.ServeJSON()
}

var WeChatClientID = beego.AppConfig.String("WeChatAPPID")
var WeChatClientSecret = beego.AppConfig.String("WeChatKey")

func (c *APIController) AuthWeChat() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")
	addition := c.Input().Get("addition")
	//redirectURL := c.Input().Get("redirect_url")

	var resp Response
	var res authResponse
	res.IsAuthenticated = true

	if state != beego.AppConfig.String("AuthState") {
		res.IsAuthenticated = false
		resp = Response{Status: "fail", Msg: "unauthorized", Data: res}
		c.ServeJSON()
		return
	}

	params := url.Values{}
	params.Add("code", code)
	params.Add("grant_type", "authorization_code")
	params.Add("appid", WeChatClientID)
	params.Add("secret", WeChatClientSecret)

	getAccessKeyUrl := fmt.Sprintf("%s?%s", "https://api.weixin.qq.com/sns/oauth2/access_token", params.Encode())

	tokenResponse, err := httpClient.Get(getAccessKeyUrl)
	if err != nil {
		panic(err)
	}
	defer tokenResponse.Body.Close()
	tokenContent, err := ioutil.ReadAll(tokenResponse.Body)
	if err != nil {
		panic(err)
	}
	var accessTokenResp *GetAccessTokenRespFromWeChat
	err = json.Unmarshal(tokenContent, &accessTokenResp)
	if err != nil {
		panic(err)
	}
	token := accessTokenResp.AccessToken
	openid := accessTokenResp.Openid

	getUserInfoUrl := fmt.Sprintf("https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s", token, openid)
	getUserInfoResponse, err := httpClient.Get(getUserInfoUrl)
	if err != nil {
		panic(err)
	}
	defer getUserInfoResponse.Body.Close()
	userInfoContent, err := ioutil.ReadAll(getUserInfoResponse.Body)
	var userInfo userInfoFromWeChat
	err = json.Unmarshal(userInfoContent, &userInfo)
	if err != nil {
		res.IsAuthenticated = false // unexpected return
		panic(err)
	}

	if openid == "" {
		resp = Response{Status: "fail", Msg: "Login failed, please try again."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if addition == "signup" {
		userId := object.HasWeChatAccount(openid)
		if userId != "" {
			if object.IsForbidden(userId) {
				c.forbiddenAccountResp(userId)
				return
			}
			if len(object.GetMemberAvatar(userId)) == 0 {
				avatar := UploadAvatarToOSS(userInfo.AvatarUrl, userId)
				object.LinkMemberAccount(userId, "avatar", avatar)
			}
			c.SetSessionUser(userId)
			util.LogInfo(c.Ctx, "API: [%s] signed in", userId)
			res.IsSignedUp = true
		} else {
			res.IsSignedUp = false
		}
		res.Addition = userInfo.Nickname
		res.Avatar = url.QueryEscape(userInfo.AvatarUrl)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: openid}
	} else {
		memberId := c.GetSessionUser()
		if memberId == "" {
			resp = Response{Status: "fail", Msg: "no account exist", Data: res}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
		linkRes := object.LinkMemberAccount(memberId, "wechat_account", userInfo.Nickname)
		linkRes = object.LinkMemberAccount(memberId, "wechat_open_id", openid)
		linkRes = object.LinkMemberAccount(memberId, "wechat_verified_time", util.GetCurrentTime())
		if linkRes {
			resp = Response{Status: "ok", Msg: "success", Data: linkRes}
		} else {
			resp = Response{Status: "fail", Msg: "link account failed", Data: linkRes}
		}
		if len(object.GetMemberAvatar(memberId)) == 0 {
			avatar := UploadAvatarToOSS(userInfo.AvatarUrl, memberId)
			object.LinkMemberAccount(memberId, "avatar", avatar)
		}
	}

	c.Data["json"] = resp

	c.ServeJSON()
}
