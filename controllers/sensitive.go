// Copyright 2021 The casbin Authors. All Rights Reserved.
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
	"github.com/casbin/casnode/object"
)

// @Title AddSensitive
// @router /add-sensitive [get]
// @Tag Seneistive API
func (c *ApiController) AddSensitive() {
	if c.RequireAdmin() {
		return
	}

	sensitiveWord := c.Input().Get("word")
	if sensitiveWord == "" {
		c.ResponseError("You didn't input a sensitive word.")
		return
	}
	if len(sensitiveWord) > 64 {
		c.ResponseError("This sensitive word is too long.")
		return
	}
	if object.IsSensitiveWord(sensitiveWord) {
		c.ResponseError("This is already a sensitive word.")
		return
	}

	object.AddSensitiveWord(sensitiveWord)

	c.ResponseOk()
}

// @Title DelSensitive
// @router /del-sensitive [get]
// @Tag Seneistive API
func (c *ApiController) DelSensitive() {
	if c.RequireAdmin() {
		return
	}

	sensitiveWord := c.Input().Get("word")
	if sensitiveWord == "" {
		c.ResponseError("You didn't input a sensitive word.")
		return
	}
	if !object.IsSensitiveWord(sensitiveWord) {
		c.ResponseError("This is not a sensitive word.")
		return
	}

	object.DeleteSensitiveWord(sensitiveWord)

	c.ResponseOk()
}

// @Title GetSensitive
// @router /get-sensitive [get]
// @Tag Seneistive API
func (c *ApiController) GetSensitive() {
	c.Data["json"] = object.GetSensitiveWords()
	c.ServeJSON()
}
