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
	"strings"

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
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

func addInitialChat(user *casdoorsdk.User) {
	chats, err := object.GetChats(user.Name)
	if err != nil {
		panic(err)
	}

	if len(chats) != 0 {
		return
	}

	randomName := util.GetRandomName()
	chat := object.Chat{
		Owner:        user.Name,
		Name:         fmt.Sprintf("chat_%s", randomName),
		CreatedTime:  util.GetCurrentTime(),
		UpdatedTime:  util.GetCurrentTime(),
		DisplayName:  fmt.Sprintf("New Chat - %s", randomName),
		Type:         "AI",
		Category:     "Chat Category - 1",
		User1:        fmt.Sprintf("%s/%s", user.Owner, user.Name),
		User2:        "",
		Users:        []string{fmt.Sprintf("%s/%s", user.Owner, user.Name)},
		ClientIp:     user.CreatedIp,
		UserAgent:    user.Education,
		MessageCount: 0,
	}

	_, err = object.AddChat(&chat)
	if err != nil {
		panic(err)
	}

	randomName = util.GetRandomName()
	answerMessage := &object.Message{
		Owner:       user.Name,
		Name:        fmt.Sprintf("message_%s", util.GetRandomName()),
		CreatedTime: util.GetCurrentTimeEx(chat.CreatedTime),
		// Organization: message.Organization,
		Chat:         chat.Name,
		ReplyTo:      "Welcome",
		Author:       "AI",
		Text:         "",
		VectorScores: []object.VectorScore{},
	}
	_, err = object.AddMessage(answerMessage)
	if err != nil {
		panic(err)
	}
}

func (c *ApiController) anonymousSignin() {
	clientIp := strings.Replace(util.GetIPFromRequest(c.Ctx.Request), ": ", "", -1)
	userAgent := c.Ctx.Request.UserAgent()
	username := getContentHash(fmt.Sprintf("%s|%s", clientIp, userAgent))

	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	user := casdoorsdk.User{
		Owner:           casdoorOrganization,
		Name:            username,
		CreatedTime:     util.GetCurrentTime(),
		Id:              username,
		Type:            "anonymous-user",
		DisplayName:     "User",
		Avatar:          "https://cdn.casdoor.com/casdoor/resource/built-in/admin/casibase-user.png",
		AvatarType:      "",
		PermanentAvatar: "",
		Email:           "",
		EmailVerified:   false,
		Phone:           "",
		CountryCode:     "",
		Region:          "",
		Location:        "",
		Education:       userAgent,
		IsAdmin:         false,
		CreatedIp:       clientIp,
	}

	addInitialChat(&user)

	c.ResponseOk(user)
}

func (c *ApiController) GetAccount() {
	configPublicDomain := beego.AppConfig.String("publicDomain")
	if configPublicDomain == "" || c.Ctx.Request.Host != configPublicDomain {
		_, ok := c.RequireSignedIn()
		if !ok {
			return
		}
	} else {
		_, ok := c.CheckSignedIn()
		if !ok {
			c.anonymousSignin()
			return
		}
	}

	claims := c.GetSessionClaims()

	c.ResponseOk(claims)
}
