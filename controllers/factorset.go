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

// GetGlobalFactorsets
// @Title Get Global Factorsets
// @Tag Factorset API
// @Description Retrieves all factorsets from the database.
// @Success 200 {array} []*Factorset "An array of factorset objects."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database."
// @router /get-global-factorsets [get]
func (c *ApiController) GetGlobalFactorsets() {
	factorsets, err := object.GetGlobalFactorsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorsets)
}

// GetFactorsets
// @Title Get Factorsets
// @Tag Factorset API
// @Description Retrieves factorsets belonging to a specific owner from the database.
// @Param owner query string true "The owner of the factorsets to retrieve."
// @Success 200 {array} []*Factorset "An array of factorset objects owned by the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the owner is invalid."
// @router /get-factorsets [get]
func (c *ApiController) GetFactorsets() {
	owner := c.Input().Get("owner")

	factorsets, err := object.GetFactorsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorsets)
}

// GetFactorset
// @Title Get Factorset
// @Tag Factorset API
// @Description Retrieves a specific factorset from the database based on its ID.
// @Param id query string true "The ID of the factorset to retrieve."
// @Success 200 {*Factorset} Factorset "The factorset object if found."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the provided ID is invalid."
// @router /get-factorset [get]
func (c *ApiController) GetFactorset() {
	id := c.Input().Get("id")

	factorset, err := object.GetFactorset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorset)
}

// UpdateFactorset
// @Title Update Factorset
// @Tag Factorset API
// @Description Updates a factorset in the database based on the provided ID and data.
// @Param id query string true "The ID used to identify the factorset to update."
// @Param factorset body Factorset true "The updated factorset data."
// @Success 200 {boolean} bool "True if the factorset was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body, accessing the database, or the provided ID is invalid."
// @router /update-factorset [put]
func (c *ApiController) UpdateFactorset() {
	id := c.Input().Get("id")

	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateFactorset(id, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddFactorset
// @Title Add Factorset
// @Tag Factorset API
// @Description Adds a new factorset to the database.
// @Param factorset body Factorset true "The factorset data to be added."
// @Success 200 {boolean} bool "True if the factorset was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
// @router /add-factorset [post]
func (c *ApiController) AddFactorset() {
	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddFactorset(&factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteFactorset
// @Title Delete Factorset
// @Tag Factorset API
// @Description Deletes a factorset from the database.
// @Param factorset body Factorset true "The factorset data to be deleted."
// @Success 200 {boolean} bool "True if the factorset was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
// @router /delete-factorset [delete]
func (c *ApiController) DeleteFactorset() {
	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteFactorset(&factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
