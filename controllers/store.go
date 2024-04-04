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

	"github.com/casibase/casibase/object"
)

// GetGlobalStores
// @Title GetGlobalStores
// @Tag Store API
// @Description get global stores
// @Success 200 {array} object.Store The Response object
// @router /get-global-stores [get]
func (c *ApiController) GetGlobalStores() {
	stores, err := object.GetGlobalStores()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(stores)
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
	if store == nil {
		c.ResponseError("store should not be empty")
		return
	}

	host := c.Ctx.Request.Host
	origin := getOriginFromHost(host)
	err = store.Populate(origin)
	if err != nil {
		// gentle error
		c.ResponseOk(store, err.Error())
		return
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

	success, err := object.UpdateStore(id, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
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
