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
	"github.com/the-open-agent/openagent/model"
	"github.com/the-open-agent/openagent/object"
	"github.com/the-open-agent/openagent/util"
)

// GetGlobalProviders
// @Title GetGlobalProviders
// @Tag Provider API
// @Description get global providers
// @Success 200 {array} object.Provider The Response object
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
// @Description get providers
// @Success 200 {array} object.Provider The Response object
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
// @Description get provider
// @Param id query string true "The id of provider"
// @Success 200 {object} object.Provider The Response object
// @router /get-provider [get]
func (c *ApiController) GetProvider() {
	id := c.Input().Get("id")
	user := c.GetSessionUser()

	provider, err := object.GetProvider(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if err = object.EnsureProviderApiKey(provider); err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProvider(provider, true, user))
}

// UpdateProvider
// @Title UpdateProvider
// @Tag Provider API
// @Description update provider
// @Param id query string true "The id (owner/name) of the provider"
// @Param body body object.Provider true "The details of the provider"
// @Success 200 {object} controllers.Response The Response object
// @router /update-provider [post]
func (c *ApiController) UpdateProvider() {
	if !c.RequireGlobalAdmin() {
		return
	}

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
// @Description add provider
// @Param body body object.Provider true "The details of the provider"
// @Success 200 {object} controllers.Response The Response object
// @router /add-provider [post]
func (c *ApiController) AddProvider() {
	if !c.RequireGlobalAdmin() {
		return
	}

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
// @Description delete provider
// @Param body body object.Provider true "The details of the provider"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-provider [post]
func (c *ApiController) DeleteProvider() {
	if !c.RequireGlobalAdmin() {
		return
	}

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

// FetchProviderModels
// @Title FetchProviderModels
// @Tag Provider API
// @Description fetch provider models
// @Param body body object.Provider true "The details of the provider"
// @Success 200 {array} string The Response object
// @router /fetch-provider-models [post]
func (c *ApiController) FetchProviderModels() {
	if !c.RequireAdmin() {
		return
	}

	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if provider.ClientSecret == "***" || provider.ExternalApiKey == "***" {
		dbProvider, err := object.GetProvider(fmt.Sprintf("%s/%s", provider.Owner, provider.Name))
		if err == nil && dbProvider != nil {
			if !c.requireSecretNotRedirected(provider.KeepsMaskedSecretWithNewEndpoint(dbProvider)) {
				return
			}
			if provider.ClientSecret == "***" {
				provider.ClientSecret = dbProvider.ClientSecret
			}
			if provider.ExternalApiKey == "***" {
				provider.ExternalApiKey = dbProvider.ExternalApiKey
			}
		}
	}

	secretKey := provider.ClientSecret
	if secretKey == "" {
		secretKey = provider.ExternalApiKey
	}

	url := provider.ProviderUrl

	p, err := model.GetModelProvider(provider.Type, provider.SubType, provider.ClientId, secretKey, provider.UserKey, 0, 0, 0, 0, 0, url, provider.ApiVersion, provider.CompatibleProvider, 0, 0, "", false)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if p == nil {
		c.ResponseOk([]string{})
		return
	}

	models, err := p.ListModels()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(models)
}
