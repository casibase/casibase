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

	if !claims.IsAdmin {
		claims.Type = "chat-user"
	}

	err = c.addInitialChatAndMessage(&claims.User)
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

func (c *ApiController) addInitialChat(organization string, userName string) (*object.Chat, error) {
	store, err := object.GetDefaultStore("admin")
	if err != nil {
		return nil, err
	}
	if store == nil {
		return nil, fmt.Errorf("The default store is not found")
	}

	randomName := util.GetRandomName()
	currentTime := util.GetCurrentTime()
	chat := &object.Chat{
		Owner:        "admin",
		Name:         fmt.Sprintf("chat_%s", randomName),
		CreatedTime:  currentTime,
		UpdatedTime:  currentTime,
		Organization: organization,
		DisplayName:  fmt.Sprintf("New Chat - %d", 1),
		Store:        store.Name,
		Category:     "Default Category",
		Type:         "AI",
		User:         userName,
		User1:        "",
		User2:        "",
		Users:        []string{userName},
		ClientIp:     c.getClientIp(),
		UserAgent:    c.getUserAgent(),
		MessageCount: 0,
	}

	if store.Welcome != "Hello" {
		chat.DisplayName = fmt.Sprintf("新会话 - %d", 1)
		chat.Category = "默认分类"
	}

	chat.ClientIpDesc = util.GetDescFromIP(chat.ClientIp)
	chat.UserAgentDesc = util.GetDescFromUserAgent(chat.UserAgent)

	_, err = object.AddChat(chat)
	if err != nil {
		return nil, err
	}

	return chat, nil
}

func (c *ApiController) addInitialChatAndMessage(user *casdoorsdk.User) error {
	chats, err := object.GetChatsByUser("admin", user.Name)
	if err != nil {
		return err
	}

	if len(chats) != 0 {
		return nil
	}

	organizationName := user.Owner
	userName := user.Name

	chat, err := c.addInitialChat(organizationName, userName)
	if err != nil {
		return err
	}

	answerMessage := &object.Message{
		Owner:        "admin",
		Name:         fmt.Sprintf("message_%s", util.GetRandomName()),
		CreatedTime:  util.GetCurrentTimeEx(chat.CreatedTime),
		Organization: chat.Organization,
		User:         userName,
		Chat:         chat.Name,
		ReplyTo:      "Welcome",
		Author:       "AI",
		Text:         "",
		VectorScores: []object.VectorScore{},
	}
	_, err = object.AddMessage(answerMessage)
	return err
}

func (c *ApiController) anonymousSignin() {
	clientIp := c.getClientIp()
	userAgent := c.getUserAgent()
	hash := getContentHash(fmt.Sprintf("%s|%s", clientIp, userAgent))
	username := fmt.Sprintf("u-%s", hash)

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
		Education:       "",
		IsAdmin:         false,
		CreatedIp:       "",
	}

	err := c.addInitialChatAndMessage(&user)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(user)
}

func (c *ApiController) isPublicDomain() bool {
	configPublicDomain := beego.AppConfig.String("publicDomain")
	if configPublicDomain == "" {
		return false
	}

	if strings.Contains(configPublicDomain, ",") {
		configPublicDomains := strings.Split(configPublicDomain, ",")
		for _, domain := range configPublicDomains {
			if c.Ctx.Request.Host == domain {
				return true
			}
		}
	} else {
		if c.Ctx.Request.Host == configPublicDomain {
			return true
		}
	}

	return false
}

func (c *ApiController) GetAccount() {
	if !c.isPublicDomain() {
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
