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
	"encoding/json"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
)

// @Title GetFrontConfById
// @Description Get front conf by id
// @Success 200 {object} object.FrontConf The Response object
// @router /get-front-conf-by-id [get]
// @Tag FrontConf API
func (c *ApiController) GetFrontConfById() {
	id := c.Input().Get("id")

	conf := object.GetFrontConfById(id)
	c.ResponseOk(conf)
}

// @Title GetFrontConfsByField
// @Description Get front confs by field
// @Success 200 {array} object.FrontConf The Response object
// @router /get-front-confs-by-field [get]
// @Tag FrontConf API
func (c *ApiController) GetFrontConfsByField() {
	field := c.Input().Get("field")

	confs := object.GetFrontConfsByField(field)
	c.ResponseOk(confs)
}

// @router /update-front-conf-by-id [post]
// @Tag FrontConf API
// @Title UpdateFrontConfById
func (c *ApiController) UpdateFrontConfById() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")
	// get from body
	var value string
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &value)
	tags := service.Finalword(value)
	affect, err := object.UpdateFrontConfById(id, value, tags)
	if err != nil {
		c.ResponseError(err.Error())
	}
	c.ResponseOk(affect)
}

// @router /update-front-confs-by-filed [post]
// @Tag FrontConf API
// @Title UpdateFrontConfsByField
func (c *ApiController) UpdateFrontConfsByField() {
	if c.RequireAdmin() {
		return
	}

	filed := c.Input().Get("field")
	var confs []*object.FrontConf
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &confs)
	if err != nil {
		c.ResponseError(err.Error())
	}

	err = object.UpdateFrontConfsByField(confs, filed)
	if err != nil {
		c.ResponseError(err.Error())
	}
	c.ResponseOk(nil)
}

// @router /restore-front-confs [post]
// @Tag FrontConf API
// @Title RestoreFrontConfs
func (c *ApiController) RestoreFrontConfs() {
	if c.RequireAdmin() {
		return
	}

	filed := c.Input().Get("field")
	res := object.UpdateFrontConfsByField(object.Confs, filed)
	c.ResponseOk(res)
}
