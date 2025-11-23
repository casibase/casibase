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
// @Description Get all global messages with optional pagination, filtering and sorting. When pageSize and p parameters are provided, returns paginated results. Supports filtering by field/value pairs, sorting, and store filtering. Used for admin message management and moderation.
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'author'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'AI'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Param   store        query    string  false   "Filter by store name"
// @Success 200 {array} object.Message "Successfully returns array of message objects with optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve messages"
// @router /get-global-messages [get]
func (c *ApiController) GetGlobalMessages() {
	owner := "admin"
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
		c.ResponseOk(messages)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetMessageCount(owner, field, value, store)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		messages, err := object.GetPaginationMessages(owner, paginator.Offset(), limit, field, value, sortField, sortOrder, store)
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
// @Description Get messages for a specific user and chat conversation with user isolation enforcement. Non-admin users can only view their own messages. Admin users can view all messages or filter by selectedUser. Returns all messages in a chat conversation including both user and AI responses.
// @Param   user         query    string  false   "User ID in format 'owner/name', e.g., 'admin/user1' (optional for admins)"
// @Param   chat         query    string  false   "Chat ID to filter messages by specific conversation, e.g., 'chat-123abc'"
// @Param   selectedUser query    string  false   "Selected user for admin to view specific user's messages, e.g., 'admin/user1'"
// @Success 200 {array} object.Message "Successfully returns array of message objects in chronological order"
// @Failure 400 {object} controllers.Response "Bad request: Invalid parameters"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot view other users' messages"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve messages"
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

	if chat == "" {
		messages, err := object.GetMessages("admin", user, "")
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
// GetMessage
// @Title GetMessage
// @Tag Message API
// @Description Get detailed information of a specific message including text content, author (User/AI), tokens used, vector scores, error details, and metadata. Returns complete message object with all associated data.
// @Param   id    query    string  true    "Message ID in format 'owner/name', e.g., 'admin/message-123abc'"
// @Success 200 {object} object.Message "Successfully returns message object with all details including text, author, tokens, vector scores, etc."
// @Failure 400 {object} controllers.Response "Bad request: Invalid message ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this message"
// @Failure 404 {object} controllers.Response "Not found: Message does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve message"
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
// @Description Update an existing message's content and metadata including text, author, tokens, vector scores, error information, and notification settings. Users can only update their own messages. Supports email notification if NeedNotify flag is set. Use isHitOnly parameter for updating only hit/feedback fields without full update.
// @Param   id         query    string          true    "Message ID in format 'owner/name', e.g., 'admin/message-123abc'"
// @Param   isHitOnly  query    string          false   "Update only hit/feedback fields when set to 'true', e.g., 'true'"
// @Param   body       body     object.Message  true    "Complete message object with updated fields including text, author, tokenCount, vectorScores, errorText, needNotify, etc."
// @Success 200 {object} controllers.Response "Successfully updated message, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid message data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot update other users' messages or insufficient permissions"
// @Failure 404 {object} controllers.Response "Not found: Message does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update message or send email notification"
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

	ok := c.IsCurrentUser(message.User)
	if !ok {
		return
	}

	if message.NeedNotify {
		err = message.SendEmail(c.GetAcceptLanguage())
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
// @Description Create a new message in a chat conversation. For user messages, automatically generates AI response using configured model provider. Supports RAG (Retrieval Augmented Generation) with vector search, tool calls, streaming responses, and various model capabilities. Users can only create messages for themselves. Returns updated chat object with new messages.
// @Param   body    body    object.Message    true    "Message object with required fields: owner, user, chat, author ('User'/'AI'), text content, and optional fields: replyTo, store, vectorScores, etc."
// @Success 200 {object} object.Chat "Successfully created message and generated AI response (if applicable), returns updated chat object with messages"
// @Failure 400 {object} controllers.Response "Bad request: Invalid message data, missing required fields, chat not found, store not found, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot create messages for other users, insufficient permissions, or rate limit exceeded"
// @Failure 404 {object} controllers.Response "Not found: Chat, store, or provider does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create message, generate AI response, or perform vector search"
// @router /add-message [post]
func (c *ApiController) AddMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok := c.IsCurrentUser(message.User)
	if !ok {
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
		chat, err = c.addInitialChat(message.Organization, message.User, message.Store)
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
	storeId := util.GetId(message.Owner, message.Store)
	store, err := object.GetStore(storeId)
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
			modelProvider := chat.ModelProvider
			if modelProvider == "" {
				// Fallback to store's model provider if chat doesn't have one
				storeId := util.GetId(chat.Owner, chat.Store)
				store, storeErr := object.GetStore(storeId)
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
		}
	}

	c.ResponseOk(chat)
}

// DeleteMessage
// @Title DeleteMessage
// @Tag Message API
// @Description Delete an existing message from a chat conversation. This operation is irreversible and removes the message and its metadata. Note: Consider using this carefully as it may break conversation context for AI responses.
// @Param   body    body    object.Message    true    "Message object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted message, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid message data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete message"
// @Failure 404 {object} controllers.Response "Not found: Message does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete message"
// @router /delete-message [post]
func (c *ApiController) DeleteMessage() {
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

// DeleteWelcomeMessage
// @Title DeleteWelcomeMessage
// @Tag Message API
// @Description Delete a welcome message for anonymous or authenticated users. For anonymous users, verifies ownership using client IP and user agent hash. For authenticated users, verifies user ownership. Used to dismiss welcome/onboarding messages in chat interfaces.
// @Param   body    body    object.Message    true    "Message object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted welcome message, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid message data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required for non-anonymous users"
// @Failure 403 {object} controllers.Response "Forbidden: No permission to delete this welcome message (user mismatch or client verification failed)"
// @Failure 404 {object} controllers.Response "Not found: Message does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete welcome message"
// @router /delete-welcome-message [post]
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
