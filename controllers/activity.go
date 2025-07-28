// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"strings"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetActivities
// @Title GetActivities
// @Tag Activity API
// @Description get activities
// @Param days query string true "days count"
// @Success 200 {array} object.Activity The Response object
// @router /get-activities [get]
func (c *ApiController) GetActivities() {
	days := util.ParseInt(c.Input().Get("days"))
	user := c.Input().Get("selectedUser")
	fieldParam := c.Input().Get("field")
	fields := strings.Split(fieldParam, ",")

	activities, err := object.GetActivities(days, user, fields)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(activities)
}
