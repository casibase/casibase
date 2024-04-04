// Copyright 2024 The casbin Authors. All Rights Reserved.
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

	usages, err := object.GetUsages(days)
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

	usages, err := object.GetRangeUsages(rangeType, count)
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
