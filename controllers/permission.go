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

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/util"
)

func (c *ApiController) GetPermissions() {
	permissions, err := casdoorsdk.GetPermissions()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permissions)
}

func (c *ApiController) GetPermission() {
	id := c.Input().Get("id")
	_, name := util.GetOwnerAndNameFromId(id)

	permission, err := casdoorsdk.GetPermission(name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permission)
}

func (c *ApiController) UpdatePermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	success, err := casdoorsdk.UpdatePermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddPermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoorsdk.AddPermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeletePermission() {
	var permission casdoorsdk.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := casdoorsdk.DeletePermission(&permission)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
