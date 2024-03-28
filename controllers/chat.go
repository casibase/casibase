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

// GetGlobalChats
// @Title GetGlobalChats
// @Tag Chat API
// @Description Retrieves all global chats available in the system.
// @Success 200 {array} object.Chat "The response object contains an array of global chats."
// @Failure 400 {string} string "The error message in case of failure."
// @router /get-global-chats [get]
func (c *ApiController) GetGlobalChats() {
	chats, err := object.GetGlobalChats()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(chats)
}

// GetChats
// @Title GetChats
// @Tag Chat API
// @Description Retrieves chats based on a specific field and its value, or for a specific user.
// @Param user query string false "The user associated with the chats to retrieve."
// @Param field query string false "The field to filter the chats (e.g., 'user')."
// @Param value query string false "The value for the specified field to filter the chats."
// @Success 200 {array} object.Chat "The response object contains an array of chats."
// @Failure 400 {string} string "The error message in case of failure."
// @router /get-chats [get]
func (c *ApiController) GetChats() {
	user := c.Input().Get("user")
	field := c.Input().Get("field")
	value := c.Input().Get("value")

	if c.IsAdmin() {
		user = ""
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
// @Description Retrieves a single chat by its ID.
// @Param id query string true "The ID of the chat to retrieve."
// @Success 200 {object} object.Chat "The response object contains the detailed information of the retrieved chat."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Updates an existing chat based on its ID.
// @Param id query string true "The ID of the chat to update."
// @Success 200 {boolean} bool "The success status of the update operation."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Adds a new chat to the system.
// @Success 200 {boolean} bool "The success status of the add operation."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Deletes an existing chat from the system. Also deletes all messages associated with this chat.
// @Success 200 {boolean} bool "The success status of the delete operation."
// @Failure 400 {string} string "The error message in case of failure."
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
