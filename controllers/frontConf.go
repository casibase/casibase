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
)

// @Title GetFrontConfsByField
// @Description Get front confs by field
// @Success 200 {array} object.FrontConf The Response object
// @router /get-front-conf-by-field [get]
// @Tag FrontConf API
func (c *ApiController) GetFrontConfByField() {
	field := c.Input().Get("field")

	c.Data["json"] = object.GetFrontConfByField(field)
	c.ServeJSON()
}

// @Title GetFrontConfs
// @Description Get all front confs
// @Success 200 {array} array The Response object
// @router /get-front-confs [get]
// @Tag FrontConf API
func (c *ApiController) GetFrontConfs() {
	confs := make(map[string]string)
	conf := object.GetFrontConfs()

	for _, frontconf := range conf {
		confs[frontconf.Id] = frontconf.Value
	}

	c.Data["json"] = confs
	c.ServeJSON()
}

// @router /update-front-conf [post] 
// @Tag FrontConf API
// @Title UpdateFrontConf
func (c *ApiController) UpdateFrontConf() {
	var confs []*object.FrontConf

	if c.RequireAdmin() {
		return
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &confs)
	if err != nil {
		panic(err)
	}
	res := object.UpdateFrontConf(confs)
	c.ResponseOk(res)

}

// @router /update-to-default-conf [post] 
// @Tag FrontConf API
// @Title UpdateFrontConfToDefault
func (c *ApiController) UpdateFrontConfToDefault() {

	if c.RequireAdmin() {
		return
	}

	res := object.UpdateFrontConf(object.Confs)
	c.ResponseOk(res)

}
