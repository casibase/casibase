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
// @Description Get all global stores with optional pagination and filtering. When pageSize and p parameters are provided, returns paginated results with admin permission check. Supports filtering by name, field, value and sorting. Requires admin privileges for paginated access.
// @Param   name         query    string  false   "Filter by store name"
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'owner'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'admin'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Success 200 {array} object.Store "Successfully returns array of store objects with optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Admin login required for paginated access"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient admin permissions"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve stores"
// @router /get-global-stores [get]
func (c *ApiController) GetGlobalStores() {
	name := c.Input().Get("name")
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
		if !c.RequireAdmin() {
			return
		}

		limit := util.ParseInt(limit)
		count, err := object.GetStoreCount(name, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		stores, err := object.GetPaginationStores(paginator.Offset(), limit, name, field, value, sortField, sortOrder)
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
// @Description Get all stores for a specific owner with store isolation applied based on user's homepage field. Returns stores filtered by the user's access permissions.
// @Param   owner    query    string  true    "Owner of the stores, typically 'admin', e.g., 'admin'"
// @Success 200 {array} object.Store "Successfully returns array of store objects accessible to the user"
// @Failure 400 {object} controllers.Response "Bad request: Invalid owner parameter"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve stores"
// @router /get-stores [get]
func (c *ApiController) GetStores() {
	owner := c.Input().Get("owner")

	stores, err := object.GetStores(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Apply store isolation based on user's Homepage field
	stores = FilterStoresByHomepage(stores, c.GetSessionUser())

	c.ResponseOk(stores)
}

// GetStore
// @Title GetStore
// @Tag Store API
// @Description Get detailed information of a specific store including configuration, statistics, and settings. Populates store data with origin and language-specific information. Special handling for default store with ID 'admin/_casibase_default_store_'.
// @Param   id    query    string  true    "Store ID in format 'owner/name', e.g., 'admin/store-built-in' or 'admin/_casibase_default_store_' for default store"
// @Success 200 {object} object.Store "Successfully returns store object with all configuration and statistics"
// @Failure 400 {object} controllers.Response "Bad request: Invalid store ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this store"
// @Failure 404 {object} controllers.Response "Not found: Store does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve or populate store data"
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
		err = store.Populate(origin, c.GetAcceptLanguage())
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
// @Description Update an existing store's configuration and settings. Handles default store logic: prevents removing default status from the only default store, and automatically unsets other stores when setting a new default. Requires appropriate permissions.
// @Param   id      query    string         true    "Store ID in format 'owner/name', e.g., 'admin/store-built-in'"
// @Param   body    body     object.Store   true    "Complete store object with updated fields including name, displayName, provider, embedding model, etc."
// @Success 200 {object} controllers.Response "Successfully updated store, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid store data, cannot unset default store, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update store"
// @Failure 404 {object} controllers.Response "Not found: Store does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update store"
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
		c.ResponseError(c.T("store:given that there must be one default store in Casibase, you cannot set this store to non-default. You can directly set another store as default"))
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
// @Description Create a new store with specified configuration. The store is a knowledge base that stores vectors for semantic search. When creating a default store, automatically unsets other default stores. Requires appropriate permissions.
// @Param   body    body    object.Store    true    "Store object with required fields: owner, name, displayName, provider, embedding model configuration, etc."
// @Success 200 {object} controllers.Response "Successfully created store, returns success status and store ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid store data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create store"
// @Failure 409 {object} controllers.Response "Conflict: Store with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create store"
// @router /add-store [post]
func (c *ApiController) AddStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	err = object.SyncDefaultProvidersToStore(&store)
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
// @Description Delete an existing store and all its associated data. Cannot delete the default store - another store must be set as default first. This operation also removes all vectors and files associated with the store. Requires appropriate permissions.
// @Param   body    body    object.Store    true    "Store object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted store, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Cannot delete default store, invalid store data, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete store"
// @Failure 404 {object} controllers.Response "Not found: Store does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete store"
// @router /delete-store [post]
func (c *ApiController) DeleteStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if store.IsDefault {
		c.ResponseError(c.T("store:Cannot delete the default store"))
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
// @Description Refresh and regenerate all vectors in the specified store by re-embedding all documents. This is useful after changing embedding models or updating store configuration. The operation may take significant time for large stores. Requires appropriate permissions.
// @Param   body    body    object.Store    true    "Store object with owner and name to identify which store's vectors to refresh"
// @Success 200 {object} controllers.Response "Successfully refreshed vectors, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid store data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to refresh store vectors"
// @Failure 404 {object} controllers.Response "Not found: Store does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to refresh vectors or embedding service unavailable"
// @router /refresh-store-vectors [post]
func (c *ApiController) RefreshStoreVectors() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ok, err := object.RefreshStoreVectors(&store, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(ok)
}

// GetStoreNames
// @Title GetStoreNames
// @Tag Store API
// @Description Get a lightweight list of stores with only name and display name fields for the specified owner. Returns minimal store data optimized for dropdown lists and selection UIs. Store isolation is applied based on user's homepage field.
// @Param   owner    query    string  true    "Owner of the stores, typically 'admin', e.g., 'admin'"
// @Success 200 {array} object.Store "Successfully returns array of store objects with only name and displayName fields"
// @Failure 400 {object} controllers.Response "Bad request: Invalid owner parameter"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve store names"
// @router /get-store-names [get]
func (c *ApiController) GetStoreNames() {
	owner := c.Input().Get("owner")
	storeNames, err := object.GetStoresByFields(owner, []string{"name", "display_name"}...)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Apply store isolation based on user's Homepage field
	storeNames = FilterStoresByHomepage(storeNames, c.GetSessionUser())

	c.ResponseOk(storeNames)
}
