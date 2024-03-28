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

// GetGlobalProviders
// @Title Get Global Providers
// @Tag Provider API
// @Description Retrieves global providers from the database.
// @Success 200 {object} []Provider "An array of global providers."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database."
// @router /global-providers [get]
func (c *ApiController) GetGlobalProviders() {
	providers, err := object.GetGlobalProviders()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProviders(providers, true))
}

// GetProviders
// @Title Get Providers
// @Tag Provider API
// @Description Retrieves providers belonging to a specific owner from the database.
// @Param owner query string true "The owner of the providers to retrieve."
// @Success 200 {object} []Provider "An array of providers belonging to the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /providers [get]
func (c *ApiController) GetProviders() {
	owner := "admin"

	providers, err := object.GetProviders(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProviders(providers, true))
}

// GetProvider
// @Title Get Provider
// @Tag Provider API
// @Description Retrieves a provider by its ID from the database.
// @Param id query string true "The ID of the provider to retrieve."
// @Success 200 {object} Provider "The provider with the specified ID."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /provider [get]
func (c *ApiController) GetProvider() {
	id := c.Input().Get("id")

	provider, err := object.GetProvider(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProvider(provider, true))
}

// UpdateProvider
// @Title Update Provider
// @Tag Provider API
// @Description Updates a provider's information in the database.
// @Param id query string true "The ID of the provider to update."
// @Param provider body object.Provider true "The updated provider information."
// @Success 200 {boolean} bool "True if the provider was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /update-provider [put]
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
// @Title Add Provider
// @Tag Provider API
// @Description Adds a new provider to the database.
// @Param provider body object.Provider true "The provider data to be added."
// @Success 200 {boolean} bool "True if the provider was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if the provider data is invalid."
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
// @Title Delete Provider
// @Tag Provider API
// @Description Deletes a provider from the database.
// @Param provider body object.Provider true "The provider data to be deleted."
// @Success 200 {boolean} bool "True if the provider was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /delete-provider [delete]
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
