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

	"github.com/casbin/casibase/casdoor"
)

func (c *ApiController) GetPermissions() {
	owner := c.Input().Get("owner")

	permissions, err := casdoor.GetPermissions(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permissions)
}

func (c *ApiController) GetPermission() {
	id := c.Input().Get("id")

	permission, err := casdoor.GetPermission(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permission)
}

func (c *ApiController) UpdatePermission() {
	id := c.Input().Get("id")

	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	success, err := casdoor.UpdatePermission(id, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddPermission() {
	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoor.AddPermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeletePermission() {
	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoor.DeletePermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
