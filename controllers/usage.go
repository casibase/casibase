// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetUsages
// @Title GetUsages
// @Tag Usage API
// @Description get usages
// @Param days query string true "days count"
// @Success 200 {array} object.Usage The Response object
// @router /get-usages [get]
func (c *ApiController) GetUsages() {
	days := util.ParseInt(c.Input().Get("days"))
	user := c.Input().Get("selectedUser")

	usages, err := object.GetUsages(days, user)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	usageMetadata, err := object.GetUsageMetadata()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(usages, usageMetadata)
}

// GetRangeUsages
// @Title GetRangeUsages
// @Tag Usage API
// @Description get range usages
// @Param count query string true "count of range usages"
// @Success 200 {array} object.Usage The Response object
// @router /get-range-usages [get]
func (c *ApiController) GetRangeUsages() {
	rangeType := c.Input().Get("rangeType")
	count := util.ParseInt(c.Input().Get("count"))
	user := c.Input().Get("user")

	usages, err := object.GetRangeUsages(rangeType, count, user)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	usageMetadata, err := object.GetUsageMetadata()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(usages, usageMetadata)
}

// GetUsers
// @Title GetUsers
// @Tag Usage API
// @Description get users
// @Success 200 {array} string The Response object
// @router /get-users [get]
func (c *ApiController) GetUsers() {
	user := c.Input().Get("user")
	if c.IsAdmin() {
		user = ""
	}
	users, err := object.GetUsers(user)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(users)
}

// GetUserTableInfos
// @Title GetUserTableInfos
// @Tag Usage API
// @Description get userTableInfos
// @Success 200 {array} object.Usage The Response object
// @router /get-usages [get]
func (c *ApiController) GetUserTableInfos() {
	user := c.Input().Get("user")
	if c.IsAdmin() {
		user = ""
	}
	userInfos, err := object.GetUserTableInfos(user)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(userInfos)
}
