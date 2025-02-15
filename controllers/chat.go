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
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalChats
// @Title GetGlobalChats
// @Tag Chat API
// @Description get global chats
// @Success 200 {array} object.Chat The Response object
// @router /get-global-chats [get]
func (c *ApiController) GetGlobalChats() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		chats, err := object.GetGlobalChats()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(chats)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetChatCount("", field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		chats, err := object.GetPaginationChat("", paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(chats, paginator.Nums())
	}
}

// GetChats
// @Title GetChats
// @Tag Chat API
// @Description get chats
// @Param user query string true "The user of chat"
// @Param field query string true "The field of chat"
// @Param value query string true "The value of chat"
// @Success 200 {array} object.Chat The Response object
// @router /get-chats [get]
func (c *ApiController) GetChats() {
	user := c.Input().Get("user")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	selectedUser := c.Input().Get("selectedUser")

	if c.IsAdmin() {
		user = ""
	}

	if selectedUser != "" && selectedUser != "null" && c.IsAdmin() {
		user = selectedUser
	}

	if !c.IsAdmin() && user != selectedUser && selectedUser != "" {
		c.ResponseError("You can only view your own chats")
		return
	}

	var chats []*object.Chat
	var err error
	if field == "user" {
		chats, err = object.GetChats("admin", value)
	} else {
		chats, err = object.GetChats("admin", user)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chats)
}

// GetChat
// @Title GetChat
// @Tag Chat API
// @Description get chat
// @Param id query string true "The id of chat"
// @Success 200 {object} object.Chat The Response object
// @router /get-chat [get]
func (c *ApiController) GetChat() {
	id := c.Input().Get("id")

	chat, err := object.GetChat(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chat)
}

// UpdateChat
// @Title UpdateChat
// @Tag Chat API
// @Description update Chat
// @Param id query string true "The id (owner/name) of the chat"
// @Param body body object.Chat true "The details of the chat"
// @Success 200 {object} controllers.Response The Response object
// @router /update-chat [post]
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

// AddChat
// @Title AddChat
// @Tag Chat API
// @Description add chat
// @Param body body object.Chat true "The details of the chat"
// @Success 200 {object} controllers.Response The Response object
// @router /add-chat [post]
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

// DeleteChat
// @Title DeleteChat
// @Tag Chat API
// @Description delete chat
// @Param body body object.Chat true "The details of the chat"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-chat [post]
func (c *ApiController) DeleteChat() {
	ok := c.RequireAdmin()
	if !ok {
		return
	}

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

	message := object.Message{
		Owner: chat.Owner,
		Chat:  chat.Name,
	}
	success, err = object.DeleteMessagesByChat(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
