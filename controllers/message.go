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
	"fmt"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalMessages
// @Title GetGlobalMessages
// @Tag Message API
// @Description get global messages
// @Success 200 {array} object.Message The Response object
// @router /get-global-messages [get]
func (c *ApiController) GetGlobalMessages() {
	owner := "admin"
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		messages, err := object.GetGlobalMessages()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(messages)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetMessageCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		messages, err := object.GetPaginationMessage(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(messages, paginator.Nums())
	}
}

// GetMessages
// @Title GetMessages
// @Tag Message API
// @Description get Messages
// @Param user query string true "The user of message"
// @Param chat query string true "The chat of message"
// @Success 200 {array} object.Message The Response object
// @router /get-Messages [get]
func (c *ApiController) GetMessages() {
	user := c.Input().Get("user")
	chat := c.Input().Get("chat")
	selectedUser := c.Input().Get("selectedUser")

	if c.IsAdmin() {
		user = ""
	}

	if selectedUser != "" && selectedUser != "null" && c.IsAdmin() {
		user = selectedUser
	}

	if !c.IsAdmin() && user != selectedUser && selectedUser != "" {
		c.ResponseError("You can only view your own messages")
		return
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
// @Description get message
// @Param id query string true "The id of message"
// @Success 200 {object} object.Message The Response object
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
// @Description update message
// @Param id query string true "The id (owner/name) of the message"
// @Param body body object.Message true "The details of the message"
// @Success 200 {object} controllers.Response The Response object
// @router /update-message [post]
func (c *ApiController) UpdateMessage() {
	id := c.Input().Get("id")
	isHitOnly := c.Input().Get("isHitOnly")

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

	success, err := object.UpdateMessage(id, &message, isHitOnly == "true")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddMessage
// @Title AddMessage
// @Tag Message API
// @Description add message
// @Param body body object.Message true "The details of the message"
// @Success 200 {object} object.Chat The Response object
// @router /add-message [post]
func (c *ApiController) AddMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	id := util.GetIdFromOwnerAndName(message.Owner, message.Name)
	originMessage, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	// if originMessage not nil, means edit message, delete all later messages
	if originMessage != nil {
		err = object.DeleteAllLaterMessages(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	addMessageAfterSuccess := true
	if message.IsRegenerated {
		messages, err := object.GetChatMessages(message.Chat)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		var lastAIMessage *object.Message
		var lastUserMessage *object.Message
		for i := len(messages) - 1; i >= 0; i-- {
			if messages[i].Author == "AI" && messages[i].ErrorText != "" {
				lastAIMessage = messages[i]
				break
			}
		}
		if lastAIMessage == nil {
			for i := len(messages) - 1; i >= 0; i-- {
				if messages[i].Author == "AI" {
					lastAIMessage = messages[i]
					break
				}
			}
		}
		for i := len(messages) - 1; i >= 0; i-- {
			if messages[i].Author != "AI" {
				lastUserMessage = messages[i]
				break
			}
		}
		if lastAIMessage != nil {
			if lastAIMessage.ReplyTo == "Welcome" {
				message.Author = "AI"
				message.ReplyTo = "Welcome"
				addMessageAfterSuccess = false
			}
			_, err = object.DeleteMessage(lastAIMessage)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
		}
		if lastUserMessage != nil {
			_, err = object.DeleteMessage(lastUserMessage)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
		}
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
	err = object.RefineMessageFiles(&message, origin)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	message.CreatedTime = util.GetCurrentTimeWithMilli()

	if message.Text == "" {
		c.ResponseError(fmt.Sprintf("The question should not be empty for message: %v", message))
		return
	}

	success, err := object.AddMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if success && addMessageAfterSuccess {
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
// @Description delete message
// @Param body body object.Message true "The details of the message"
// @Success 200 {object} controllers.Response The Response object
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

func (c *ApiController) DeleteWelcomeMessage() {
	var message *object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	id := util.GetIdFromOwnerAndName(message.Owner, message.Name)
	message, err = object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	user := c.GetSessionUsername()
	if user != "" && user != message.User {
		c.ResponseError("No permission")
		return
	}

	if user == "" {
		clientIp := c.getClientIp()
		userAgent := c.getUserAgent()
		hash := getContentHash(fmt.Sprintf("%s|%s", clientIp, userAgent))
		username := fmt.Sprintf("u-%s", hash)
		if username != message.User {
			c.ResponseError("No permission")
			return
		}
	}

	if message.Author != "AI" || message.ReplyTo != "Welcome" {
		c.ResponseError("No permission")
		return
	}

	success, err := object.DeleteMessage(message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}
