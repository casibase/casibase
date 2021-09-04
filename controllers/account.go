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
	"github.com/astaxie/beego"
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

var CasdoorEndpoint = beego.AppConfig.String("casdoorEndpoint")
var ClientId = beego.AppConfig.String("clientId")
var ClientSecret = beego.AppConfig.String("clientSecret")
var JwtSecret = beego.AppConfig.String("jwtSecret")
var CasdoorOrganization = beego.AppConfig.String("casdoorOrganization")
var CasdoorApplication = beego.AppConfig.String("casdoorApplication")

func init() {
	auth.InitConfig(CasdoorEndpoint, ClientId, ClientSecret, JwtSecret, CasdoorOrganization, CasdoorApplication)
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

	affected, err := object.UpdateMemberOnlineStatus(&claims.User, true, util.GetCurrentTime())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	claims.AccessToken = token.AccessToken
	c.SetSessionClaims(claims)

	c.ResponseOk(claims, affected)
}

// @Title Signout
// @Description sign out the current member
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /signout [post]
func (c *ApiController) Signout() {
	claims := c.GetSessionClaims()
	if claims != nil {
		_, err := object.UpdateMemberOnlineStatus(&claims.User, false, util.GetCurrentTime())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.SetSessionClaims(nil)

	c.ResponseOk()
}

// @Title GetAccount
// @Description Get current account
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /get-account [get]
func (c *ApiController) GetAccount() {
	if c.RequireSignedIn() {
		return
	}

	claims := c.GetSessionClaims()

	c.ResponseOk(claims)
}

func (c *ApiController) UpdateAccountBalance(amount int) {
	user := c.GetSessionUser()
	user.Score += amount
	c.SetSessionUser(user)
}
