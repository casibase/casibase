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

func (c *ApiController) GetGlobalProviders() {
	providers, err := object.GetGlobalProviders()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProviders(providers, true))
}

func (c *ApiController) GetProviders() {
	owner := "admin"

	providers, err := object.GetProviders(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProviders(providers, true))
}

func (c *ApiController) GetProvider() {
	id := c.Input().Get("id")

	provider, err := object.GetProvider(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedProvider(provider, true))
}

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
