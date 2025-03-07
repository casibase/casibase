// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

	"github.com/beego/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func init() {
	InitAuthConfig()
}

func InitAuthConfig() {
	casdoorEndpoint := beego.AppConfig.String("casdoorEndpoint")
	clientId := beego.AppConfig.String("clientId")
	clientSecret := beego.AppConfig.String("clientSecret")
	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	casdoorApplication := beego.AppConfig.String("casdoorApplication")

	casdoorsdk.InitConfig(casdoorEndpoint, clientId, clientSecret, "", casdoorOrganization, casdoorApplication)
	application, err := casdoorsdk.GetApplication(casdoorApplication)
	if err != nil {
		panic(err)
	}
	if application == nil {
		panic(fmt.Errorf("The application: %s does not exist", casdoorApplication))
	}

	cert, err := casdoorsdk.GetCert(application.Cert)
	if err != nil {
		panic(err)
	}
	if cert == nil {
		panic(fmt.Errorf("The cert: %s does not exist", application.Cert))
	}

	casdoorsdk.InitConfig(casdoorEndpoint, clientId, clientSecret, cert.Certificate, casdoorOrganization, casdoorApplication)
}

// Signin
// @Title Signin
// @Tag Account API
// @Description sign in
// @Param code  query string true "code of account"
// @Param state query string true "state of account"
// @Success 200 {casdoorsdk} casdoorsdk.Claims The Response object
// @router /signin [post]
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

	if strings.Count(claims.Type, "-") <= 1 {
		if !claims.IsAdmin && claims.Type != "chat-admin" {
			claims.Type = "chat-user"
		}
	}

	err = c.addInitialChatAndMessage(&claims.User)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	claims.AccessToken = token.AccessToken
	c.SetSessionClaims(claims)
	userId := claims.User.Owner + "/" + claims.User.Name
	c.Ctx.Input.SetParam("recordUserId", userId)

	c.ResponseOk(claims)
}

// Signout
// @Title Signout
// @Tag Account API
// @Description sign out
// @Success 200 {object} controllers.Response The Response object
// @router /signout [post]
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

	currentTime := util.GetCurrentTime()
	chat := &object.Chat{
		Owner:        "admin",
		Name:         fmt.Sprintf("chat_%s", util.GetRandomName()),
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
		Users:        []string{},
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
	chats, err := object.GetChats("admin", user.Name)
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

func (c *ApiController) isSafePassword() (bool, error) {
	claims := c.GetSessionClaims()
	if claims == nil {
		return true, nil
	}

	if len(claims.User.Id) != 11 || !strings.HasPrefix(claims.User.Id, "270") {
		return true, nil
	}

	user, err := casdoorsdk.GetUser(claims.User.Name)
	if err != nil {
		return false, err
	}

	if user.Password == "#NeedToModify#" {
		return false, nil
	} else {
		return true, nil
	}
}

// GetAccount
// @Title GetAccount
// @Tag Account API
// @Description get account
// @Success 200 {casdoorsdk} casdoorsdk.Claims The Response object
// @router /get-account [get]
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

	isSafePassword, err := c.isSafePassword()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !isSafePassword {
		claims.User.Password = "#NeedToModify#"
	}

	c.ResponseOk(claims)
}
