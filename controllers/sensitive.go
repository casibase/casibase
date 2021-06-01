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
	"fmt"
	"github.com/casbin/casnode/object"
)

func (c *ApiController) AddSensitive() {
	if c.RequireLogin() {
		return
	}
	memberId := c.GetSessionUsername()
	member := object.GetMember(memberId)
	if !member.IsModerator {
		resp := Response{Status: "fail", Msg: "You are not admin, you can't add sensitive words."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	sensitiveWord := c.Input().Get("word")
	if sensitiveWord == "" {
		resp := Response{Status: "fail", Msg: "You didn't input a sensitive word."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	if len(sensitiveWord) > 64 {
		resp := Response{Status: "fail", Msg: "This sensitive word is too long."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	if object.IsSensitiveWord(sensitiveWord) {
		resp := Response{Status: "fail", Msg: "This is already a sensitive word."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	object.AddSensitiveWord(sensitiveWord)
	fmt.Println("Sensitive word added: " + sensitiveWord)
	resp := Response{Status: "ok"}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DelSensitive() {
	if c.RequireLogin() {
		return
	}
	memberId := c.GetSessionUsername()
	member := object.GetMember(memberId)
	if !member.IsModerator {
		resp := Response{Status: "fail", Msg: "You are not admin, you can't delete sensitive words."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	sensitiveWord := c.Input().Get("word")
	if sensitiveWord == "" {
		resp := Response{Status: "fail", Msg: "You didn't input a sensitive word."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	if !object.IsSensitiveWord(sensitiveWord) {
		resp := Response{Status: "fail", Msg: "This is not a sensitive word."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	object.DeleteSensitiveWord(sensitiveWord)
	resp := Response{Status: "ok"}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetSensitive() {
	c.Data["json"] = object.GetSensitiveWords()
	c.ServeJSON()
}