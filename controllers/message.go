// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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
	"github.com/the-open-agent/openagent/conf"
	"github.com/the-open-agent/openagent/object"
	"github.com/the-open-agent/openagent/util"
)

func (c *ApiController) ensureMessageMutable(message *object.Message) (*object.Chat, bool) {
	if message == nil || message.Chat == "" {
		return nil, true
	}
	chat, err := object.GetChat(util.GetId(message.Owner, message.Chat))
	if err != nil {
		c.ResponseError(err.Error())
		return nil, false
	}
	if chat == nil {
		c.ResponseError(fmt.Sprintf("The chat: %s/%s is not found", message.Owner, message.Chat))
		return nil, false
	}
	if chat.IsApiLog() {
		c.ResponseError(c.T("controllers:API chat logs are read-only"))
		return nil, false
	}
	return chat, true
}

func preserveMessageOwnership(message, persistedMessage *object.Message) {
	message.Owner = persistedMessage.Owner
	message.Name = persistedMessage.Name
	message.CreatedTime = persistedMessage.CreatedTime
	message.Organization = persistedMessage.Organization
	message.Store = persistedMessage.Store
	message.User = persistedMessage.User
	message.Chat = persistedMessage.Chat
}

// GetGlobalMessages
// @Title GetGlobalMessages
// @Tag Message API
// @Description get global messages
// @Success 200 {array} object.Message The Response object
// @router /get-global-messages [get]
func (c *ApiController) GetGlobalMessages() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	store := c.Input().Get("store")

	if limit == "" || page == "" {
		messages, err := object.GetGlobalMessages()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		messages, err = c.filterStoreAdminMessages(messages)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if err = object.PopulateMessagesReadOnly(messages); err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(messages)
	} else {
		limitInt := util.ParseInt(limit)
		username := c.GetSessionUsername()
		var isolationOk bool
		store, isolationOk = c.EnforceStoreIsolation(store)
		if !isolationOk {
			return
		}

		var count int64
		var messages []*object.Message
		var err error

		if c.IsGlobalAdmin() {
			count, err = object.GetMessageCount("admin", field, value, store)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			paginator := pagination.SetPaginator(c.Ctx, limitInt, count)
			messages, err = object.GetPaginationMessages("admin", paginator.Offset(), limitInt, field, value, sortField, sortOrder, store)
		} else if c.IsStoreAdmin() {
			// Store admin sees messages belonging to their stores
			storeNames, err2 := getStoreNamesForUser(username)
			if err2 != nil {
				c.ResponseError(err2.Error())
				return
			}
			storeNames, ok := narrowStoreAdminStoreNames(storeNames, store)
			if !ok {
				c.ResponseError(c.T("controllers:You can only access data from your assigned store"))
				return
			}
			count, err = object.GetMessageCountByStoreNames(storeNames, field, value)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			paginator := pagination.SetPaginator(c.Ctx, limitInt, count)
			messages, err = object.GetPaginationMessagesByStoreNames(storeNames, paginator.Offset(), limitInt, field, value, sortField, sortOrder)
		} else {
			// Regular user sees only their own messages
			count, err = object.GetMessageCountByUser(username, store, field, value)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			paginator := pagination.SetPaginator(c.Ctx, limitInt, count)
			messages, err = object.GetPaginationMessagesByUser(username, store, paginator.Offset(), limitInt, field, value, sortField, sortOrder)
		}
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if err = object.PopulateMessagesReadOnly(messages); err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(messages, count)
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
		c.ResponseError(c.T("controllers:You can only view your own messages"))
		return
	}

	if !c.IsAdmin() {
		// Non-admins may only read their own messages. An empty user would match every
		// message, so it is never used as a filter for them.
		user = c.GetSessionUsername()
		if chat == "" {
			if user == "" {
				c.ResponseOk([]*object.Message{})
				return
			}
		} else {
			chatObj, err := object.GetChat(util.GetId("admin", chat))
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			if chatObj != nil && chatObj.User != user {
				c.ResponseError(c.T("auth:Unauthorized operation"))
				return
			}
		}
	}

	if chat != "" && !c.IsAdmin() {
		messages, err := object.GetChatMessages(chat)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		ownMessages := []*object.Message{}
		for _, message := range messages {
			if message.User == user {
				ownMessages = append(ownMessages, message)
			}
		}
		if err = object.PopulateMessagesReadOnly(ownMessages); err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(ownMessages)
		return
	}

	if chat == "" {
		messages, err := object.GetLatestMessages("admin", user, maxListSize)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		messages, err = c.filterStoreAdminMessages(messages)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if err = object.PopulateMessagesReadOnly(messages); err != nil {
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
	messages, err = c.filterStoreAdminMessages(messages)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if err = object.PopulateMessagesReadOnly(messages); err != nil {
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

	if message == nil {
		c.ResponseError("Message not found")
		return
	}
	if err = object.PopulateMessagesReadOnly([]*object.Message{message}); err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Check if user has permission to view this message
	if !c.requireUserDataAccess(message.User, message.Store) {
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

	persistedMessage, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if persistedMessage == nil {
		c.ResponseError("Message not found")
		return
	}
	if _, ok := c.ensureMessageMutable(persistedMessage); !ok {
		return
	}

	var message object.Message
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok := c.requireUserDataAccess(persistedMessage.User, persistedMessage.Store)
	if !ok {
		return
	}
	preserveMessageOwnership(&message, persistedMessage)
	// Billing is written by the answer stream; a liked or cancelled message comes back from a client that never saw it.
	message.TokenCount = persistedMessage.TokenCount
	message.Price = persistedMessage.Price
	message.Currency = persistedMessage.Currency
	message.TransactionId = persistedMessage.TransactionId
	message.Data = persistedMessage.Data
	if !c.IsAdmin() {
		// ReplyTo picks the question that an answer (and its notification email) is built from, so a
		// user repointing it could read any other user's message; the notification is admin-only.
		message.Author = persistedMessage.Author
		message.ReplyTo = persistedMessage.ReplyTo
		message.NeedNotify = false
	}

	if message.NeedNotify {
		if conf.IsCasdoorAvailable() {
			err = message.SendEmail(c.GetAcceptLanguage())
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
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

	var chat *object.Chat
	if originMessage != nil {
		if !c.requireUserDataAccess(originMessage.User, originMessage.Store) {
			return
		}
		var mutable bool
		chat, mutable = c.ensureMessageMutable(originMessage)
		if !mutable {
			return
		}
		preserveMessageOwnership(&message, originMessage)
	} else {
		if !c.requireUserDataAccess(message.User, message.Store) {
			return
		}
		if message.Chat != "" {
			var mutable bool
			chat, mutable = c.ensureMessageMutable(&message)
			if !mutable {
				return
			}
			if !c.IsAdmin() && chat.User != message.User {
				c.ResponseError(c.T("auth:Unauthorized operation"))
				return
			}
			if !c.requireUserDataAccess(chat.User, chat.Store) {
				return
			}
		}
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
	if message.Chat == "" {
		chat, err = c.addInitialChat(message.Organization, message.User, message.Store, message.ModelProvider)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		message.Organization = chat.Organization
		message.Chat = chat.Name
	}

	host := c.Ctx.Request.Host
	origin := getOriginFromHost(host)
	err = object.RefineMessageFiles(&message, origin, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	message.CreatedTime = util.GetCurrentTimeWithMilli()

	if message.Text == "" {
		c.ResponseError(fmt.Sprintf("The question should not be empty for message: %v", message))
		return
	}

	// Check for forbidden words
	store, err := object.ResolveStoreByOwnerAndName(message.Owner, message.Store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if store != nil {
		contains, forbiddenWord := store.ContainsForbiddenWords(message.Text)
		if contains {
			c.ResponseError(fmt.Sprintf("Your message contains a forbidden word: \"%s\"", forbiddenWord))
			return
		}
	}

	if message.Author != "AI" {
		var tag string
		message.Text, tag = object.MaskQuestion(message.Text)
		if tag != "" {
			message.Guardrail = tag
		}
	}

	success, err := object.AddMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if success && addMessageAfterSuccess {
		chatId := util.GetId(message.Owner, message.Chat)
		modelProvider := chat.ModelProvider
		if modelProvider == "" {
			// Fallback to store's model provider if chat doesn't have one
			store, storeErr := object.ResolveStoreForChat(chat)
			if storeErr == nil && store != nil {
				modelProvider = store.ModelProvider
			}
		}
		answerMessage := &object.Message{
			Owner:         message.Owner,
			Name:          fmt.Sprintf("message_%s", util.GetRandomName()),
			CreatedTime:   util.GetCurrentTimeEx(message.CreatedTime),
			Organization:  message.Organization,
			Store:         chat.Store,
			User:          message.User,
			Chat:          message.Chat,
			ReplyTo:       message.Name,
			Author:        "AI",
			Text:          "",
			FileName:      message.FileName,
			VectorScores:  []object.VectorScore{},
			ModelProvider: modelProvider,
		}
		_, err = object.AddMessage(answerMessage)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		chat, err = object.GetChat(chatId)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if chat == nil {
			c.ResponseError(fmt.Sprintf(c.T("object:The chat: %s is not found"), chatId))
			return
		}
		chat.IsUnread = true
		chat.IsGenerating = true
		_, err = object.UpdateChat(chatId, chat)
		if err != nil {
			c.ResponseError(err.Error())
			return
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
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	persistedMessage, err := object.GetMessage(message.GetId())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if persistedMessage == nil {
		c.ResponseError("Message not found")
		return
	}
	if !c.requireUserDataAccess(persistedMessage.User, persistedMessage.Store) {
		return
	}
	if _, ok := c.ensureMessageMutable(persistedMessage); !ok {
		return
	}

	success, err := object.DeleteMessage(persistedMessage)
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
	if message == nil {
		c.ResponseError("Message not found")
		return
	}

	user := c.GetSessionUsername()
	if user != "" && user != message.User {
		c.ResponseError(c.T("controllers:No permission"))
		return
	}

	if user == "" {
		clientIp := c.getClientIp()
		userAgent := c.getUserAgent()
		hash := getContentHash(fmt.Sprintf("%s|%s", clientIp, userAgent))
		username := fmt.Sprintf("u-%s", hash)
		if username != message.User {
			c.ResponseError(c.T("controllers:No permission"))
			return
		}
	}

	if message.Author != "AI" || message.ReplyTo != "Welcome" {
		c.ResponseError(c.T("controllers:No permission"))
		return
	}

	success, err := object.DeleteMessage(message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}
