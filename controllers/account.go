// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	_ "embed"
	"fmt"

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

//go:embed token_jwt_key.pem
var JwtPublicKey string

func init() {
	InitAuthConfig()
}

func InitAuthConfig() {
	casdoorEndpoint := beego.AppConfig.String("casdoorEndpoint")
	clientId := beego.AppConfig.String("clientId")
	clientSecret := beego.AppConfig.String("clientSecret")
	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	casdoorApplication := beego.AppConfig.String("casdoorApplication")

	casdoorsdk.InitConfig(casdoorEndpoint, clientId, clientSecret, JwtPublicKey, casdoorOrganization, casdoorApplication)
}

func (c *ApiController) Signin() {
	code := c.Input().Get("code")
	state := c.Input().Get("state")

	token, err := casdoorsdk.GetOAuthToken(code, state)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	claims, err := casdoorsdk.ParseJwtToken(token.AccessToken)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	claims.AccessToken = token.AccessToken
	c.SetSessionClaims(claims)

	c.ResponseOk(claims)
}

func (c *ApiController) Signout() {
	c.SetSessionClaims(nil)

	c.ResponseOk()
}

func (c *ApiController) GetAccount() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	claims := c.GetSessionClaims()

	c.ResponseOk(claims)
}

func (c *ApiController) GetUser() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	name := c.Input().Get("name")
	user, err := casdoorsdk.GetUser(name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	fmt.Println(name, user)
	c.ResponseOk(user)
}
