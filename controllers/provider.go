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

// GetGlobalProviders
// @Title GetGlobalProviders
// @Tag Provider API
// @Description Get all global AI providers (LLM, embedding, TTS, STT, etc.) available in the system. Returns providers with sensitive credentials masked for security. Providers include OpenAI, Azure, Anthropic, and other AI service configurations.
// @Success 200 {array} object.Provider "Successfully returns array of provider objects with masked credentials"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve providers"
// @router /get-global-providers [get]
func (c *ApiController) GetGlobalProviders() {
	user := c.GetSessionUser()
	providers, err := object.GetGlobalProviders()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProviders(providers, true, user))
}

// GetProviders
// @Title GetProviders
// @Tag Provider API
// @Description Get providers for admin owner with optional pagination, filtering and store isolation. When pageSize and p parameters are provided, returns paginated results with admin permission check. Store isolation is enforced based on user's homepage field. Returns providers with masked credentials.
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'type'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'OpenAI'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Param   store        query    string  false   "Filter by store name for store isolation"
// @Success 200 {array} object.Provider "Successfully returns array of provider objects with masked credentials and optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Admin login required for paginated access"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions or store isolation violation"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve providers"
// @router /get-providers [get]
func (c *ApiController) GetProviders() {
	owner := "admin"
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	user := c.GetSessionUser()
	storeName := c.Input().Get("store")

	// Apply store isolation based on user's Homepage field
	var ok bool
	storeName, ok = c.EnforceStoreIsolation(storeName)
	if !ok {
		return
	}

	if limit == "" || page == "" {
		providers, err := object.GetProviders(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		providers = object.GetMaskedProviders(providers, true, user)
		c.ResponseOk(providers)
	} else {
		if !c.RequireAdmin() {
			return
		}
		limit := util.ParseInt(limit)
		count, err := object.GetProviderCount(owner, storeName, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		providers, err := object.GetPaginationProviders(owner, storeName, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		providers = object.GetMaskedProviders(providers, true, user)
		c.ResponseOk(providers, paginator.Nums())
	}
}

// GetProvider
// @Title GetProvider
// @Tag Provider API
// @Description Get detailed information of a specific AI provider including configuration, API endpoints, and capabilities. Returns provider with masked credentials for security. Provider types include LLM models, embedding services, TTS, STT, and MCP tool providers.
// @Param   id    query    string  true    "Provider ID in format 'owner/name', e.g., 'admin/provider-openai-gpt4'"
// @Success 200 {object} object.Provider "Successfully returns provider object with masked sensitive credentials"
// @Failure 400 {object} controllers.Response "Bad request: Invalid provider ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this provider"
// @Failure 404 {object} controllers.Response "Not found: Provider does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve provider"
// @router /get-provider [get]
func (c *ApiController) GetProvider() {
	id := c.Input().Get("id")
	user := c.GetSessionUser()

	provider, err := object.GetProvider(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProvider(provider, true, user))
}

// UpdateProvider
// @Title UpdateProvider
// @Tag Provider API
// @Description Update an existing AI provider's configuration including API keys, endpoints, model settings, and capabilities. Use this to modify provider credentials, change model parameters, or update service configurations. Requires appropriate permissions.
// @Param   id      query    string            true    "Provider ID in format 'owner/name', e.g., 'admin/provider-openai-gpt4'"
// @Param   body    body     object.Provider   true    "Complete provider object with updated fields including type, clientId, clientSecret, host, models, etc."
// @Success 200 {object} controllers.Response "Successfully updated provider, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid provider data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update provider"
// @Failure 404 {object} controllers.Response "Not found: Provider does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update provider"
// @router /update-provider [post]
func (c *ApiController) UpdateProvider() {
	id := c.Input().Get("id")

	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateProvider(id, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddProvider
// @Title AddProvider
// @Tag Provider API
// @Description Create a new AI provider configuration for LLM models, embedding services, TTS, STT, or MCP tools. Provider owner is automatically set to 'admin'. Configure API credentials, endpoints, model parameters, and service capabilities. Requires appropriate permissions.
// @Param   body    body    object.Provider    true    "Provider object with required fields: name, type, category, clientId/clientSecret (for API auth), host, models, etc."
// @Success 200 {object} controllers.Response "Successfully created provider, returns success status and provider ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid provider data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create provider"
// @Failure 409 {object} controllers.Response "Conflict: Provider with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create provider"
// @router /add-provider [post]
func (c *ApiController) AddProvider() {
	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	provider.Owner = "admin"
	success, err := object.AddProvider(&provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteProvider
// @Title DeleteProvider
// @Tag Provider API
// @Description Delete an existing AI provider configuration. This removes the provider from the system and any stores or chats using it will need to be reconfigured. Ensure no active services depend on this provider before deletion. Requires appropriate permissions.
// @Param   body    body    object.Provider    true    "Provider object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted provider, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid provider data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete provider"
// @Failure 404 {object} controllers.Response "Not found: Provider does not exist"
// @Failure 409 {object} controllers.Response "Conflict: Provider is in use by stores or chats"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete provider"
// @router /delete-provider [post]
func (c *ApiController) DeleteProvider() {
	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteProvider(&provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// RefreshMcpTools
// @Title RefreshMcpTools
// @Tag Provider API
// @Description Refresh and reload Model Context Protocol (MCP) tools from the specified provider. MCP providers expose external tools and functions that can be used by AI models. This operation fetches the latest tool definitions and capabilities from the MCP server. Requires appropriate permissions.
// @Param   body    body    object.Provider    true    "Provider object with owner and name to identify which MCP provider to refresh"
// @Success 200 {object} object.Provider "Successfully refreshed MCP tools, returns updated provider object with refreshed tool list"
// @Failure 400 {object} controllers.Response "Bad request: Invalid provider data, not an MCP provider, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to refresh MCP tools"
// @Failure 404 {object} controllers.Response "Not found: Provider does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to connect to MCP server or refresh tools"
// @router /refresh-mcp-tools [post]
func (c *ApiController) RefreshMcpTools() {
	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	err = object.RefreshMcpTools(&provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(&provider)
}
