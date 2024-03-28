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
	"fmt"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalMessages
// @Title GetGlobalMessages
// @Tag Message API
// @Description Retrieves all global messages.
// @Success 200 {array} object.Message "The response object contains an array of global messages."
// @Failure 400 {string} string "The error message in case of failure."
// @router /get-global-messages [get]
func (c *ApiController) GetGlobalMessages() {
	messages, err := object.GetGlobalMessages()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

// GetMessages
// @Title GetMessages
// @Tag Message API
// @Description Retrieves messages for a specific user and/or chat.
// @Param user query string false "The user for whom to retrieve messages."
// @Param chat query string false "The chat for which to retrieve messages."
// @Success 200 {array} object.Message "The response object contains an array of messages."
// @Failure 400 {string} string "The error message in case of failure."
// @router /get-messages [get]
func (c *ApiController) GetMessages() {
	user := c.Input().Get("user")
	chat := c.Input().Get("chat")

	if c.IsAdmin() {
		user = ""
	}

	if chat == "" {
		messages, err := object.GetMessages("admin", user)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(messages)
		return
	}

	messages, err := object.GetChatMessages(chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

// GetMessage
// @Title GetMessage
// @Tag Message API
// @Description Retrieves a single message by its ID.
// @Param id query string true "The ID of the message to retrieve."
// @Success 200 {object} object.Message "The response object contains the detailed information of the retrieved message."
// @Failure 400 {string} string "The error message in case of failure."
// @router /get-message [get]
func (c *ApiController) GetMessage() {
	id := c.Input().Get("id")

	message, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(message)
}

// UpdateMessage
// @Title UpdateMessage
// @Tag Message API
// @Description Updates an existing message based on its ID.
// @Param id query string true "The ID of the message to update."
// @Success 200 {boolean} bool "The success status of the update operation."
// @Failure 400 {string} string "The error message in case of failure."
// @router /update-message [post]
func (c *ApiController) UpdateMessage() {
	id := c.Input().Get("id")

	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if message.NeedNotify {
		err = message.SendEmail()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		message.NeedNotify = false
	}

	success, err := object.UpdateMessage(id, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddMessage
// @Title AddMessage
// @Tag Message API
// @Description Adds a new message to the system.
// @Success 200 {object} object.Chat "The response object contains the chat information related to the new message."
// @Failure 400 {string} string "The error message in case of failure."
// @router /add-message [post]
func (c *ApiController) AddMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	var chat *object.Chat
	if message.Chat == "" {
		chat, err = c.addInitialChat(message.Organization, message.User)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		message.Organization = chat.Organization
		message.Chat = chat.Name
	} else {
		chatId := util.GetId(message.Owner, message.Chat)
		chat, err = object.GetChat(chatId)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if chat == nil {
			c.ResponseError(fmt.Sprintf("chat:The chat: %s is not found", chatId))
			return
		}
	}

	host := c.Ctx.Request.Host
	origin := getOriginFromHost(host)
	err = object.RefineMessageImages(&message, origin)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	message.CreatedTime = util.GetCurrentTimeWithMilli()

	success, err := object.AddMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if success {
		chatId := util.GetId(message.Owner, message.Chat)
		chat, err = object.GetChat(chatId)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if chat != nil && chat.Type == "AI" {
			answerMessage := &object.Message{
				Owner:        message.Owner,
				Name:         fmt.Sprintf("message_%s", util.GetRandomName()),
				CreatedTime:  util.GetCurrentTimeEx(message.CreatedTime),
				Organization: message.Organization,
				User:         message.User,
				Chat:         message.Chat,
				ReplyTo:      message.Name,
				Author:       "AI",
				Text:         "",
				FileName:     message.FileName,
				VectorScores: []object.VectorScore{},
			}
			_, err = object.AddMessage(answerMessage)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
		}
	}

	c.ResponseOk(chat)
}

// DeleteMessage
// @Title DeleteMessage
// @Tag Message API
// @Description Deletes an existing message from the system.
// @Success 200 {boolean} bool "The success status of the delete operation."
// @Failure 400 {string} string "The error message in case of failure."
// @router /delete-message [post]
func (c *ApiController) DeleteMessage() {
	ok := c.RequireAdmin()
	if !ok {
		return
	}

	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
