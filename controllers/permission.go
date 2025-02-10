// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

// GetPermissions
// @Title GetPermissions
// @Tag Permission API
// @Description get permissions
// @Success 200 {array} casdoorsdk.Permission The Response object
// @router /get-permissions [get]
func (c *ApiController) GetPermissions() {
	permissions, err := casdoorsdk.GetPermissions()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(permissions)
}

// GetPermission
// @Title GetPermission
// @Tag Permission API
// @Description get permission
// @Param id query string true "The id(owner/name) of permission"
// @Success 200 {object} casdoorsdk.Permission The Response object
// @router /get-permission [get]
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

// UpdatePermission
// @Title UpdatePermission
// @Tag Permission API
// @Description update permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /update-permission [post]
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

// AddPermission
// @Title AddPermission
// @Tag Permission API
// @Description add permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /add-permission [post]
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

// DeletePermission
// @Title DeletePermission
// @Tag Permission API
// @Description delete permission
// @Param body body casdoorsdk.Permission true "The details of the permission"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-permission [post]
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
