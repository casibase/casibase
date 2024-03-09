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
	"encoding/json"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func (c *ApiController) GetGlobalChats() {
	chats, err := object.GetGlobalChats()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chats)
}

func (c *ApiController) GetChats() {
	owner := c.Input().Get("owner")
	field := c.Input().Get("field")
	value := c.Input().Get("value")

	if c.IsAdmin() {
		owner = ""
	}

	var chats []*object.Chat
	var err error
	if field == "user" {
		chats, err = object.GetChatsByUser(owner, value)
	} else {
		chats, err = object.GetChats(owner)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chats)
}

func (c *ApiController) GetChat() {
	id := c.Input().Get("id")

	chat, err := object.GetChat(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chat)
}

func (c *ApiController) UpdateChat() {
	id := c.Input().Get("id")

	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateChat(id, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddChat() {
	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	currentTime := util.GetCurrentTime()
	chat.CreatedTime = currentTime
	chat.UpdatedTime = currentTime
	chat.ClientIp = c.getClientIp()
	chat.UserAgent = c.getUserAgent()
	chat.ClientIpDesc = util.GetDescFromIP(chat.ClientIp)
	chat.UserAgentDesc = util.GetDescFromUserAgent(chat.UserAgent)

	if chat.Store == "" {
		var store *object.Store
		store, err = object.GetDefaultStore("admin")
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if store == nil {
			c.ResponseError("The default store is not found")
			return
		}

		chat.Store = store.Name
	}

	success, err := object.AddChat(&chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteChat() {
	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteChat(&chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
