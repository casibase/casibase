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
	"sort"
	"strings"

	"github.com/beego/beego/utils/pagination"
	"github.com/the-open-agent/openagent/conf"
	"github.com/the-open-agent/openagent/object"
	"github.com/the-open-agent/openagent/util"
)

// requireStoreAdminOwnership limits store-level admins to the stores they own.
func (c *ApiController) requireStoreAdminOwnership(storeOwner string) bool {
	if c.IsGlobalAdmin() || !c.IsStoreAdmin() {
		return true
	}
	if storeOwner != c.GetSessionUsername() {
		c.ResponseError(c.T("auth:Unauthorized operation"))
		return false
	}
	return true
}

// requireStoreNameOwnership is requireStoreAdminOwnership for callers that only know the store name.
func (c *ApiController) requireStoreNameOwnership(storeName string) bool {
	if c.IsGlobalAdmin() || !c.IsStoreAdmin() || storeName == "" {
		return true
	}
	storeNames, err := getStoreNamesForUser(c.GetSessionUsername())
	if err != nil {
		c.ResponseError(err.Error())
		return false
	}
	if !util.InSlice(storeNames, storeName) {
		c.ResponseError(c.T("auth:Unauthorized operation"))
		return false
	}
	return true
}

func (c *ApiController) canViewStoreFiles(store *object.Store) bool {
	if c.IsGlobalAdmin() || store.PublishState == "Published" {
		return true
	}
	username := c.GetSessionUsername()
	return username != "" && username == store.Owner && store.Owner != "admin"
}

// GetHubStores
// @Title GetHubStores
// @Tag Store API
// @Description get published stores for the public hub (no auth required)
// @Success 200 {array} object.Store The Response object
// @router /get-hub-stores [get]
func (c *ApiController) GetHubStores() {
	stores, err := object.GetPublishedStoresFromAllDbs()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if err := object.FillStoreFavoriteCounts(stores); err != nil {
		c.ResponseError(err.Error())
		return
	}
	if err := object.FillStoreActivityCounts(stores); err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(object.GetMaskedStores(stores, c.GetSessionUser()))
}

// GetGlobalStores
// @Title GetGlobalStores
// @Tag Store API
// @Description get global stores
// @Success 200 {array} object.Store The Response object
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

		c.ResponseOk(object.GetMaskedStores(stores, c.GetSessionUser()))
	} else {
		if !c.RequireAdmin() {
			return
		}

		username := c.GetSessionUsername()
		limit := util.ParseInt(limit)

		var count int64
		var stores []*object.Store
		var err error

		if c.IsGlobalAdmin() {
			count, err = object.GetStoreCount(name, field, value)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			paginator := pagination.SetPaginator(c.Ctx, limit, count)
			stores, err = object.GetPaginationStores(paginator.Offset(), limit, name, field, value, sortField, sortOrder)
		} else {
			// Store admin: only their own stores
			count, err = object.GetStoreCountByOwner(username, field, value)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
			paginator := pagination.SetPaginator(c.Ctx, limit, count)
			stores, err = object.GetPaginationStoresByOwner(username, paginator.Offset(), limit, field, value, sortField, sortOrder)
		}
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

		if object.IsStoreVirtualSortField(sortField) {
			object.SortStoresInMemory(stores, sortField, sortOrder)
		}

		c.ResponseOk(object.GetMaskedStores(stores, c.GetSessionUser()), count)
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
	var stores []*object.Store
	var err error

	if c.IsGlobalAdmin() {
		stores, err = object.GetGlobalStores()
	} else {
		username := c.GetSessionUsername()
		stores, err = object.GetStores(username)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedStores(stores, c.GetSessionUser()))
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
	if id == "admin/_default_store_" {
		store, err = object.GetDefaultStore(c.defaultStoreOwner())
	} else {
		store, err = object.GetStoreForGetApi(id)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if store != nil {
		if err = object.EnsureStoreApiKey(store); err != nil {
			c.ResponseError(err.Error())
			return
		}

		if err = object.PopulateStoreCounts([]*object.Store{store}); err != nil {
			c.ResponseError(err.Error())
			return
		}

		// The file tree lists the store's knowledge files with their download URLs, so only the
		// owner, the global admin and visitors of a published store may see it.
		if c.canViewStoreFiles(store) {
			host := c.Ctx.Request.Host
			origin := getOriginFromHost(host)
			err = store.Populate(origin, c.GetAcceptLanguage())
			if err != nil {
				c.ResponseOk(object.GetMaskedStore(store, c.GetSessionUser()), err.Error())
				return
			}
		}
	}

	c.ResponseOk(object.GetMaskedStore(store, c.GetSessionUser()))
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

	if strings.TrimSpace(store.Name) == "" {
		c.ResponseError(c.T("store:The store name cannot be empty"))
		return
	}

	oldStore, err := object.GetStore(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if oldStore == nil {
		oldStore, err = object.GetStoreForGetApi(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}
	if oldStore == nil {
		c.ResponseError(fmt.Sprintf("store: %s not found", id))
		return
	}
	if !c.requireStoreAdminOwnership(oldStore.Owner) {
		return
	}

	if store.ExternalApiKey == "***" {
		store.ExternalApiKey = oldStore.ExternalApiKey
	}

	store.SharedBy = oldStore.SharedBy

	// Store admin cannot change the Owner field
	if !c.IsGlobalAdmin() && c.IsStoreAdmin() {
		store.Owner = oldStore.Owner
	}

	if store.Name != oldStore.Name {
		used, err := object.IsStoreNameUsedByOthers(store.Owner, store.Name)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if used {
			c.ResponseError(fmt.Sprintf(c.T("store:The name: %s is already used by another agent"), store.Name))
			return
		}
	}

	if oldStore.IsDefault && !store.IsDefault {
		c.ResponseError(c.T("store:given that there must be one default store in OpenAgent, you cannot set this store to non-default. You can directly set another store as default"))
		return
	}

	if store.PublishState != oldStore.PublishState {
		if err = c.checkPublishStateChange(oldStore, &store); err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	success, err := object.UpdateStore(id, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !oldStore.IsDefault && store.IsDefault {
		stores, err := object.GetStores(store.Owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		for _, store2 := range stores {
			if store2.Owner == store.Owner && store2.GetId() != store.GetId() && store2.IsDefault {
				store2.IsDefault = false
				success, err = object.UpdateStore(store2.GetId(), store2)
				if err != nil {
					c.ResponseError(err.Error())
					return
				}
			}
		}
	}

	if success {
		url := joinNotificationURL("agents", store.Owner, store.Name)
		title := fmt.Sprintf("%s updated agent %s/%s", c.GetSessionUsername(), store.Owner, store.Name)
		notifyStoreWatchers(store.Owner, store.Name, object.NotificationEventStoreUpdated, c.GetSessionUsername(), title, "", url)
	}

	c.ResponseOk(success)
}

// checkPublishStateChange enforces who may transition a store's publish state, and (for
// transitions into "Pending") that the store meets the hub review eligibility bar.
//
// - The super admin (global admin whose username is "admin") may set any state directly, including "Published".
// - Other admins (isAdminUser) may set any state except "Published" directly.
// - The store's own owner may only set the state to "" (Private) or "Pending" (Pending Review).
// - Anyone else may not change the publish state.
// - Everyone except the super admin must pass the eligibility check to move into "Pending".
func (c *ApiController) checkPublishStateChange(oldStore *object.Store, store *object.Store) error {
	username := c.GetSessionUsername()
	isSuperAdmin := c.IsGlobalAdmin() && username == "admin"
	if isSuperAdmin {
		return nil
	}

	isAdmin := c.IsAdmin()
	isOwner := username != "" && oldStore.Owner == username

	if isAdmin {
		if store.PublishState == "Published" {
			return fmt.Errorf("%s", c.T("store:Only the super admin can publish an agent directly. Please set the publish state to Pending Review instead"))
		}
	} else if isOwner {
		if store.PublishState != "" && store.PublishState != "Pending" {
			return fmt.Errorf("%s", c.T("store:You can only set the publish state to Private or Pending Review"))
		}
	} else {
		return fmt.Errorf("%s", c.T("auth:Unauthorized operation"))
	}

	if store.PublishState == "Pending" {
		eligible, failedChecks, err := object.CheckStorePendingReviewEligibility(store, oldStore.Name)
		if err != nil {
			return err
		}
		if !eligible {
			messages := make([]string, len(failedChecks))
			for i, key := range failedChecks {
				messages[i] = c.T(key)
			}
			return fmt.Errorf("%s", strings.Join(messages, "; "))
		}
	}

	return nil
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

	if strings.TrimSpace(store.Name) == "" {
		c.ResponseError(c.T("store:The store name cannot be empty"))
		return
	}

	if !c.IsGlobalAdmin() && c.IsStoreAdmin() {
		store.Owner = c.GetSessionUsername()
	}

	used, err := object.IsStoreNameUsedByOthers(store.Owner, store.Name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if used {
		c.ResponseError(fmt.Sprintf(c.T("store:The name: %s is already used by another agent"), store.Name))
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

	if !c.requireStoreAdminOwnership(store.Owner) {
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

// ClaimStore
// @Title ClaimStore
// @Tag Store API
// @Description claim a store owned by "admin" and transfer ownership to the current store admin
// @Param id query string true "The id (owner/name) of the store to claim"
// @Success 200 {object} controllers.Response The Response object
// @router /claim-store [post]
func (c *ApiController) ClaimStore() {
	if !c.RequireAdmin() {
		return
	}
	if c.IsGlobalAdmin() {
		c.ResponseError("global admin does not need to claim a store")
		return
	}

	id := c.Input().Get("id")
	store, err := object.GetStore(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if store == nil {
		store, err = object.GetStoreForGetApi(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}
	if store == nil {
		c.ResponseError(fmt.Sprintf("store: %s not found", id))
		return
	}
	if store.Owner != "admin" {
		c.ResponseError("only stores owned by admin can be claimed")
		return
	}

	username := c.GetSessionUsername()
	store.Owner = username
	_, err = object.UpdateStore(fmt.Sprintf("admin/%s", store.Name), store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedStore(store, c.GetSessionUser()))
}

// RefreshStoreVectors
// @Title RefreshStoreVectors
// @Tag Store API
// @Description refresh store vectors
// @Param body body object.Store true "The details of the store"
// @Success 200 {object} controllers.Response The Response object
// @router /refresh-store-vectors [post]
func (c *ApiController) RefreshStoreVectors() {
	var form object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Use the stored configuration: the request body could otherwise point the refresh at another
	// store's storage provider and pull its files into this store's knowledge base.
	store, err := object.GetStore(form.GetId())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if store == nil {
		c.ResponseError(fmt.Sprintf("store: %s not found", form.GetId()))
		return
	}

	if !c.requireStoreAdminOwnership(store.Owner) {
		return
	}

	ok, err := object.RefreshStoreVectors(store, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(ok)
}

// GetStoreNames ...
// @Title GetStoreNames
// @Tag Store API
// @Param   owner     query    string    true   "owner"
// @Description get all store name and displayName
// @Success 200 {array} object.Store The Response object
// @router /get-store-names [get]
func (c *ApiController) GetStoreNames() {
	var storeNames []*object.Store
	var err error

	if c.IsGlobalAdmin() {
		storeNames, err = object.GetStoresByFields("", []string{"name", "display_name", "avatar"}...)
	} else {
		username := c.GetSessionUsername()
		storeNames, err = object.GetStoresByFields(username, []string{"name", "display_name", "avatar"}...)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(storeNames)
}

type shareStoreForm struct {
	Owner      string `json:"owner"`
	Name       string `json:"name"`
	TargetUser string `json:"targetUser"`
}

type forkStoreForm struct {
	Owner string `json:"owner"`
	Name  string `json:"name"`
}

// AddSharedStore duplicates a store for another user (see object.ShareStore).
// @router /add-shared-store [post]
func (c *ApiController) AddSharedStore() {
	if _, ok := c.RequireSignedIn(); !ok {
		return
	}
	if !c.IsAdmin() {
		c.ResponseError(c.T("auth:this operation requires admin privilege"))
		return
	}

	var form shareStoreForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if form.Owner == "" || form.Name == "" || form.TargetUser == "" {
		c.ResponseError("owner, name and targetUser are required")
		return
	}

	src, err := object.GetStore(util.GetIdFromOwnerAndName(form.Owner, form.Name))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if src == nil {
		c.ResponseError("source store not found")
		return
	}

	if !c.IsGlobalAdmin() && src.Owner != c.GetSessionUsername() {
		c.ResponseError(c.T("auth:Unauthorized operation"))
		return
	}

	accountUser, err := object.GetUserByRuntimeName(form.TargetUser)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if accountUser == nil && !conf.IsCasdoorAvailable() {
		c.ResponseError(c.T("general:Target user not found"))
		return
	}

	newStore, err := object.ShareStore(src.Owner, src.Name, form.TargetUser, c.GetSessionUsername())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedStore(newStore, c.GetSessionUser()))
}

// ForkStore duplicates a published store configuration into the current user's account.
// @router /fork-store [post]
func (c *ApiController) ForkStore() {
	targetOwner, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var form forkStoreForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if form.Owner == "" || form.Name == "" {
		c.ResponseError("owner and name are required")
		return
	}

	src, err := object.GetStore(util.GetIdFromOwnerAndName(form.Owner, form.Name))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if src == nil {
		c.ResponseError("source store not found")
		return
	}

	if src.PublishState != "Published" && src.Owner != targetOwner && !c.IsGlobalAdmin() {
		c.ResponseError(c.T("auth:Unauthorized operation"))
		return
	}

	if src.Owner == targetOwner {
		c.ResponseError(c.T("store:You cannot fork your own agent"))
		return
	}

	alreadyForked, err := object.HasUserForkedStore(targetOwner, src.Owner, src.Name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if alreadyForked {
		c.ResponseError(c.T("store:You have already forked this agent"))
		return
	}

	newStore, err := object.ForkStore(src.Owner, src.Name, targetOwner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedStore(newStore, c.GetSessionUser()))
}

// GetStoreForks returns the stores forked from the given store.
// @router /get-store-forks [get]
func (c *ApiController) GetStoreForks() {
	owner := c.Input().Get("owner")
	name := c.Input().Get("name")
	hubDbName := c.Input().Get("hubDbName")
	if owner == "" || name == "" {
		c.ResponseError("owner and name are required")
		return
	}

	stores, err := object.GetStoreForks(owner, name, hubDbName)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedStores(stores, c.GetSessionUser()))
}
