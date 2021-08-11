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

func (c *ApiController) GetFrontConfByField() {
	field := c.Input().Get("field")

	c.Data["json"] = object.GetFrontConfByField(field)
	c.ServeJSON()
}

func (c *ApiController) GetFrontConfs() {
	confs := make(map[string]string)
	conf := object.GetFrontConfs()

	for _, frontconf := range conf {
		confs[frontconf.Id] = frontconf.Value
	}

	c.Data["json"] = confs
	c.ServeJSON()
}

func (c *ApiController) UpdateFrontConf() {
	var confs []*object.FrontConf
	var resp Response

	if !object.CheckModIdentity(c.GetSessionUsername()) {
		c.RequireAdmin(c.GetSessionUsername())
		return
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &confs)
	if err != nil {
		panic(err)
	}
	res := object.UpdateFrontConf(confs)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateFrontConfToDefault() {
	var resp Response

	if !object.CheckModIdentity(c.GetSessionUsername()) {
		c.RequireAdmin(c.GetSessionUsername())
		return
	}

	res := object.UpdateFrontConf(object.Confs)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}
