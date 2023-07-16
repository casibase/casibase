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

	"github.com/casbin/casibase/object"
)

func (c *ApiController) GetGlobalVectorsets() {
	vectorsets, err := object.GetGlobalVectorsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorsets)
}

func (c *ApiController) GetVectorsets() {
	owner := c.Input().Get("owner")

	vectorsets, err := object.GetVectorsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorsets)
}

func (c *ApiController) GetVectorset() {
	id := c.Input().Get("id")

	vectorset, err := object.GetVectorset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorset)
}

func (c *ApiController) UpdateVectorset() {
	id := c.Input().Get("id")

	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVectorset(id, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddVectorset(&vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVectorset(&vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
