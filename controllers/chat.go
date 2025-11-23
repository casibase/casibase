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
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalChats
// @Title GetGlobalChats
// @Tag Chat API
// @Description Get all global chat conversations with optional pagination, filtering and sorting. When pageSize and p parameters are provided, returns paginated results. Supports filtering by field/value pairs and sorting by specified fields. Used for admin chat management.
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'user'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'admin/user1'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Param   store        query    string  false   "Filter by store name"
// @Success 200 {array} object.Chat "Successfully returns array of chat objects with optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve chats"
// @router /get-global-chats [get]
func (c *ApiController) GetGlobalChats() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	store := c.Input().Get("store")

	if limit == "" || page == "" {
		chats, err := object.GetGlobalChats()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(chats)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetChatCount("", field, value, store)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		chats, err := object.GetPaginationChats("", paginator.Offset(), limit, field, value, sortField, sortOrder, store)
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
// @Description Get chat conversations for a specific user with filtering and time range support. Enforces user isolation - non-admin users can only view their own chats. Admin users can view all chats or filter by selectedUser. Supports store filtering and time range filtering.
// @Param   user         query    string  false   "User ID in format 'owner/name', e.g., 'admin/user1' (optional for admins)"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'store'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'store-built-in'"
// @Param   selectedUser query    string  false   "Selected user for admin to view specific user's chats, e.g., 'admin/user1'"
// @Param   store        query    string  false   "Filter by store name"
// @Param   startTime    query    string  false   "Filter by start time (ISO 8601 format), e.g., '2024-01-01T00:00:00Z'"
// @Param   endTime      query    string  false   "Filter by end time (ISO 8601 format), e.g., '2024-12-31T23:59:59Z'"
// @Success 200 {array} object.Chat "Successfully returns array of chat objects"
// @Failure 400 {object} controllers.Response "Bad request: Invalid parameters"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot view other users' chats"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve chats"
// @router /get-chats [get]
func (c *ApiController) GetChats() {
	user := c.Input().Get("user")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	selectedUser := c.Input().Get("selectedUser")
	storeName := c.Input().Get("store")
	startTime := c.Input().Get("startTime")
	endTime := c.Input().Get("endTime")

	if c.IsAdmin() {
		user = ""
	}

	if selectedUser != "" && selectedUser != "null" && c.IsAdmin() {
		user = selectedUser
	}

	if !c.IsAdmin() && user != selectedUser && selectedUser != "" {
		c.ResponseError(c.T("controllers:You can only view your own chats"))
		return
	}

	// Apply store isolation based on user's Homepage field
	var ok bool
	storeName, ok = c.EnforceStoreIsolation(storeName)
	if !ok {
		return
	}

	var chats []*object.Chat
	var err error
	if field == "user" {
		chats, err = object.GetChats("admin", storeName, value)
	} else {
		chats, err = object.GetChats("admin", storeName, user)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Filter by time range if specified
	if startTime != "" || endTime != "" {
		chats = object.FilterChatsByTimeRange(chats, startTime, endTime)
	}

	c.ResponseOk(chats)
}

// GetChat
// @Title GetChat
// GetChat
// @Title GetChat
// @Tag Chat API
// @Description Get detailed information of a specific chat conversation including messages, model provider, store configuration, and metadata. Returns complete chat object with all associated data.
// @Param   id    query    string  true    "Chat ID in format 'owner/name', e.g., 'admin/chat-123abc'"
// @Success 200 {object} object.Chat "Successfully returns chat object with all details"
// @Failure 400 {object} controllers.Response "Bad request: Invalid chat ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this chat"
// @Failure 404 {object} controllers.Response "Not found: Chat does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve chat"
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
// @Description Update an existing chat conversation's configuration including model provider, temperature, message history, and other settings. Users can only update their own chats. In demo mode, only ModelProvider can be updated. Requires user ownership verification.
// @Param   id      query    string        true    "Chat ID in format 'owner/name', e.g., 'admin/chat-123abc'"
// @Param   body    body     object.Chat   true    "Complete chat object with updated fields including name, displayName, type, category, modelProvider, store, temperature, etc."
// @Success 200 {object} controllers.Response "Successfully updated chat, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid chat data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot update other users' chats or insufficient permissions"
// @Failure 404 {object} controllers.Response "Not found: Chat does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update chat"
// @router /update-chat [post]
func (c *ApiController) UpdateChat() {
	id := c.Input().Get("id")

	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok := c.IsCurrentUser(chat.User)
	if !ok {
		return
	}

	if conf.IsDemoMode() {
		originalChat, err := object.GetChat(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if originalChat == nil {
			c.ResponseError(fmt.Sprintf("The chat: %s is not found", id))
			return
		}

		originalChat.ModelProvider = chat.ModelProvider
		chat = *originalChat
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
// @Description Create a new chat conversation with specified configuration. Automatically sets creation time, client IP, user agent, and uses default store if not specified. Users can only create chats for themselves. Tracks client metadata for analytics and security.
// @Param   body    body    object.Chat    true    "Chat object with required fields: user, name, type (single/group), and optional fields: displayName, category, modelProvider, store, temperature, etc."
// @Success 200 {object} controllers.Response "Successfully created chat, returns success status and chat ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid chat data, missing required fields, default store not found, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot create chat for other users or insufficient permissions"
// @Failure 409 {object} controllers.Response "Conflict: Chat with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create chat"
// @router /add-chat [post]
func (c *ApiController) AddChat() {
	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok := c.IsCurrentUser(chat.User)
	if !ok {
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
			c.ResponseError(c.T("chat:The default store is not found"))
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
// @Description Delete an existing chat conversation and all associated messages. This operation is irreversible and removes all chat history, messages, and metadata. Users can only delete their own chats. Requires user ownership verification.
// @Param   body    body    object.Chat    true    "Chat object to delete, must include at least owner, name, and user fields for ownership verification"
// @Success 200 {object} controllers.Response "Successfully deleted chat and associated messages, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid chat data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Cannot delete other users' chats or insufficient permissions"
// @Failure 404 {object} controllers.Response "Not found: Chat does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete chat or messages"
// @router /delete-chat [post]
func (c *ApiController) DeleteChat() {
	var chat object.Chat
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok := c.IsCurrentUser(chat.User)
	if !ok {
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
