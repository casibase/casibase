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

func (c *ApiController) GetGlobalVectors() {
	vectors, err := object.GetGlobalVectors()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectors)
}

func (c *ApiController) GetVectors() {
	owner := "admin"

	vectors, err := object.GetVectors(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectors)
}

func (c *ApiController) GetVector() {
	id := c.Input().Get("id")

	vector, err := object.GetVector(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vector)
}

func (c *ApiController) UpdateVector() {
	id := c.Input().Get("id")

	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVector(id, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
