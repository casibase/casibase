// Copyright 2021 The casbin Authors. All Rights Reserved.
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
	"github.com/casbin/casnode/object"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

// @Title Signin
// @Description sign in as a member
// @Param   code     QueryString    string  true        "The code to sign in"
// @Param   state     QueryString    string  true        "The state"
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signin [post]
func (c *ApiController) Signin() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")

	token, err := auth.GetOAuthToken(code, state)
	if err != nil {
		panic(err)
	}

	claims, err := auth.ParseJwtToken(token.AccessToken)
	if err != nil {
		panic(err)
	}

	member := object.GetMemberFromCasdoor(claims.Username)
	member.OnlineStatus = true
	object.UpdateMemberToCasdoor(member)

	claims.AccessToken = token.AccessToken
	c.SetSessionUser(claims)

	resp := &Response{Status: "ok", Msg: "", Data: claims}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title Signout
// @Description sign out the current member
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signout [post]
func (c *ApiController) Signout() {
	var resp Response

	claim := c.GetSessionUser()
	if claim != nil {
		member := object.GetMemberFromCasdoor(claim.Username)
		member.OnlineStatus = false
		object.UpdateMemberToCasdoor(member)
	}

	c.SetSessionUser(nil)

	resp = Response{Status: "ok", Msg: ""}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetAccount
// @Description Get current account
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /get-account [get]
func (c *ApiController) GetAccount() {
	var resp Response

	if c.GetSessionUser() == nil {
		resp = Response{Status: "error", Msg: "please sign in first", Data: c.GetSessionUser()}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	claims := c.GetSessionUser()
	userObj := claims
	resp = Response{Status: "ok", Msg: "", Data: userObj}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateAccountBalance(balance int) {
	claim := c.GetSessionUser()
	claim.Score = balance
	c.SetSessionUser(claim)
}
