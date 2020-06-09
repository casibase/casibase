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
	"encoding/json"

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

type SignupForm struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
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
	member, password, email := form.Username, form.Password, form.Email

	msg := object.CheckMemberSignup(member, password)
	if msg != "" {
		resp = Response{Status: "error", Msg: msg, Data: ""}
	} else {
		member := &object.Member{
			Id:       member,
			Password: password,
			Email:    email,
		}
		object.AddMember(member)

		//c.SetSessionUser(user)

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
