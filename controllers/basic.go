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
	"github.com/astaxie/beego"

	"github.com/casbin/casbin-forum/object"
)

type APIController struct {
	beego.Controller
}

func (c *APIController) GetSessionUser() string {
	user := c.GetSession("username")
	if user == nil {
		return ""
	}

	return user.(string)
}

func (c *APIController) SetSessionUser(user string) {
	c.SetSession("username", user)
}

func (c *APIController) RequireLogin() bool {
	if c.GetSessionUser() == "" {
		c.Data["json"] = Response{Status: "error", Msg: "errorNeedSignin", Data: ""}
		c.ServeJSON()

		return true
	}

	return false
}

func (c *APIController) wrapResponse(res bool) {
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

func (c *APIController) GetCommunityHealth() {
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
