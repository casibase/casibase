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
	beego "github.com/beego/beego/v2/adapter"
	"github.com/casbin/casnode/object"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

var CasdoorEndpoint = beego.AppConfig.String("casdoorEndpoint")
var ClientId = beego.AppConfig.String("clientId")
var ClientSecret = beego.AppConfig.String("clientSecret")
var JwtSecret = beego.AppConfig.String("jwtSecret")
var CasdoorOrganization = beego.AppConfig.String("casdoorOrganization")

func init() {
	auth.InitConfig(CasdoorEndpoint, ClientId, ClientSecret, JwtSecret, CasdoorOrganization)
}

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

	member := object.GetMemberFromCasdoor(claims.Name)
	member.Properties["onlineStatus"] = "true"
	affected, err := auth.UpdateUser(*member)
	if !affected {
		panic(err)
	}
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

	memberId := c.GetSessionUsername()
	if memberId != "" {
		member := object.GetMemberFromCasdoor(memberId)
		member.Properties["onlineStatus"] = "false"
		affected, err := auth.UpdateUser(*member)
		if !affected {
			panic(err)
		}
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
	if c.RequireSignedIn() {
		return
	}

	var resp Response

	claims := c.GetSessionUser()
	userObj := claims
	resp = Response{Status: "ok", Msg: "", Data: userObj}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateAccountBalance(balance int) {
	claims := c.GetSessionUser()
	claims.Score = balance
	c.SetSessionUser(claims)
}
