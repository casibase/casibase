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
	beego "github.com/beego/beego/v2/adapter"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"

	"github.com/casbin/casnode/object"
)

type ApiController struct {
	beego.Controller
}

func (c *ApiController) GetSessionUser() *auth.Claims {
	s := c.GetSession("user")
	if s == nil {
		return nil
	}

	claims := &auth.Claims{}
	err := util.JsonToStruct(s.(string), claims)
	if err != nil {
		panic(err)
	}

	return claims
}

func (c *ApiController) SetSessionUser(claims *auth.Claims) {
	if claims == nil {
		c.DelSession("user")
		return
	}

	s := util.StructToJson(claims)
	c.SetSession("user", s)
}

func (c *ApiController) GetSessionUsername() string {
	claims := c.GetSessionUser()
	if claims == nil {
		return ""
	}
	return claims.Username
}

func (c *ApiController) RequireLogin() bool {
	if c.GetSessionUser() == nil {
		c.Data["json"] = Response{Status: "error", Msg: "errorNeedSignin", Data: ""}
		c.ServeJSON()

		return true
	}

	return false
}

func (c *ApiController) wrapResponse(res bool) {
	var resp Response

	if res {
		resp = Response{Status: "ok", Msg: "", Data: ""}
		c.Data["json"] = resp
		c.ServeJSON()
	} else {
		resp = Response{Status: "error", Msg: "errorUnknown", Data: ""}
		c.Data["json"] = resp
		c.ServeJSON()
	}
}

func (c *ApiController) mutedAccountResp(memberId string) {
	resp := Response{Status: "error", Msg: "Your account has been muted", Data: memberId}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) forbiddenAccountResp(memberId string) {
	resp := Response{Status: "error", Msg: "Your account has been forbidden to log in", Data: memberId}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) RequireAdmin(memberId string) {
	resp := Response{Status: "error", Msg: "Unauthorized.", Data: memberId}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetCommunityHealth() {
	var resp Response

	res := object.CommunityHealth{
		Member: object.GetMemberNum(),
		Topic:  object.GetTopicCount(),
		Reply:  object.GetReplyCount(),
	}

	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetForumVersion() {
	var resp Response

	res := object.GetForumVersion()

	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetOnlineNum() {
	var resp Response

	onlineNum := object.GetOnlineMemberNum()
	highest := object.GetHighestOnlineNum()

	resp = Response{Status: "ok", Msg: "success", Data: onlineNum, Data2: highest}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetNodeNavigation() {
	var resp Response

	res := object.GetNodeNavigation()
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}
