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

func (c *ApiController) GetGlobalFactorsets() {
	factorsets, err := object.GetGlobalFactorsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorsets)
}

func (c *ApiController) GetFactorsets() {
	owner := c.Input().Get("owner")

	factorsets, err := object.GetFactorsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorsets)
}

func (c *ApiController) GetFactorset() {
	id := c.Input().Get("id")

	factorset, err := object.GetFactorset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorset)
}

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
