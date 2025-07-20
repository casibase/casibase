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
	"sort"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalStores
// @Title GetGlobalStores
// @Tag Store API
// @Description get global stores
// @Success 200 {array} object.Store The Response object
// @router /get-global-stores [get]
func (c *ApiController) GetGlobalStores() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		stores, err := object.GetGlobalStores()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(stores)
	} else {
		if !c.IsPreviewMode() && !c.RequireAdmin() {
			return
		}
		limit := util.ParseInt(limit)
		count, err := object.GetStoreCount(field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		stores, err := object.GetPaginationStores(paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		sort.SliceStable(stores, func(i, j int) bool {
			return stores[i].IsDefault && !stores[j].IsDefault
		})

		err = object.PopulateStoreCounts(stores)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(stores, paginator.Nums())
	}
}

// GetStores
// @Title GetStores
// @Tag Store API
// @Description get stores
// @Param owner query string true "The owner of the store"
// @Success 200 {array} object.Store The Response object
// @router /get-stores [get]
func (c *ApiController) GetStores() {
	owner := c.Input().Get("owner")

	stores, err := object.GetStores(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(stores)
}

// GetStore
// @Title GetStore
// @Tag Store API
// @Description get store
// @Param id query string true "The id (owner/name) of the store"
// @Success 200 {object} object.Store The Response object
// @router /get-store [get]
func (c *ApiController) GetStore() {
	id := c.Input().Get("id")

	var store *object.Store
	var err error
	if id == "admin/_casibase_default_store_" {
		store, err = object.GetDefaultStore("admin")
	} else {
		store, err = object.GetStore(id)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if store != nil {
		host := c.Ctx.Request.Host
		origin := getOriginFromHost(host)
		err = store.Populate(origin)
		if err != nil {
			c.ResponseOk(store, err.Error())
			return
		}
	}

	c.ResponseOk(store)
}

// UpdateStore
// @Title UpdateStore
// @Tag Store API
// @Description update store
// @Param id   query string       true "The id (owner/name) of the store"
// @Param body body  object.Store true "The details of the store"
// @Success 200 {object} controllers.Response The Response object
// @router /update-store [post]
func (c *ApiController) UpdateStore() {
	id := c.Input().Get("id")

	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	oldStore, err := object.GetStore(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if oldStore.IsDefault && !store.IsDefault {
		c.ResponseError("given that there must be one default store in Casibase, you cannot set this store to non-default. You can directly set another store as default")
		return
	}

	success, err := object.UpdateStore(id, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !oldStore.IsDefault && store.IsDefault {
		stores, err := object.GetGlobalStores()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		for _, store2 := range stores {
			if store2.GetId() != store.GetId() && store2.IsDefault {
				store2.IsDefault = false
				success, err = object.UpdateStore(store2.GetId(), store2)
				if err != nil {
					c.ResponseError(err.Error())
					return
				}
			}
		}
	}

	c.ResponseOk(success)
}

// AddStore
// @Title AddStore
// @Tag Store API
// @Description add store
// @Param body body object.Store true "The details of the store"
// @Success 200 {object} controllers.Response The Response object
// @router /add-store [post]
func (c *ApiController) AddStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if store.ModelProvider == "" {
		var modelProvider *object.Provider
		modelProvider, err = object.GetDefaultModelProvider()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if modelProvider != nil {
			store.ModelProvider = modelProvider.Name
		}
	}

	if store.EmbeddingProvider == "" {
		var embeddingProvider *object.Provider
		embeddingProvider, err = object.GetDefaultEmbeddingProvider()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if embeddingProvider != nil {
			store.EmbeddingProvider = embeddingProvider.Name
		}
	}

	success, err := object.AddStore(&store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteStore
// @Title DeleteStore
// @Tag Store API
// @Description delete store
// @Param body body object.Store true "The details of the store"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-store [post]
func (c *ApiController) DeleteStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteStore(&store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// RefreshStoreVectors
// @Title RefreshStoreVectors
// @Tag Store API
// @Description refresh store vectors
// @Param body body object.Store true "The details of the store"
// @Success 200 {object} controllers.Response The Response object
// @router /refresh-store-vectors [post]
func (c *ApiController) RefreshStoreVectors() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok, err := object.RefreshStoreVectors(&store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(ok)
}
