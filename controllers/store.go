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
// @Success 200 {array} object.Cert The Response object
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
// @Description Retrieve stores based on the owner.
// @Param owner query string false "The owner of the stores to retrieve."
// @Success 200 {array} object.Store The response object contains an array of stores.
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
// @Description Retrieves a single store based on its ID.
// @Param id query string true "The ID of the store to retrieve."
// @Success 200 {object} object.Store The response object contains the store information.
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Updates an existing store's information.
// @Param id query string true "The ID of the store to update."
// @Success 200 {boolean} bool "The success status of the update operation."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Adds a new store to the system.
// @Success 200 {boolean} bool "The success status of the add operation."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Deletes an existing store from the system.
// @Success 200 {boolean} bool "The success status of the delete operation."
// @Failure 400 {string} string "The error message in case of failure."
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
// @Description Refreshes the vector information for a specific store.
// @Success 200 {boolean} bool "The success status of the refresh operation."
// @Failure 400 {string} string "The error message in case of failure."
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
