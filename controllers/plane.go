// Copyright 2020 The casbin Authors. All Rights Reserved.
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

	"github.com/casbin/casbin-forum/object"
)

func (c *APIController) GetPlanes() {
	c.Data["json"] = object.GetPlanes()
	c.ServeJSON()
}

func (c *APIController) GetPlanesAdmin() {
	c.Data["json"] = object.GetAllPlanes()
	c.ServeJSON()
}

func (c *APIController) GetPlane() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetPlane(id)
	c.ServeJSON()
}

func (c *APIController) GetPlaneList() {
	var resp Response

	resp = Response{Status: "ok", Msg: "success", Data: object.GetPlaneList()}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) AddPlane() {
	var plane object.Plane
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &plane)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddPlane(&plane)
}

func (c *APIController) UpdatePlaneInfo() {
	var info updatePlaneInfo
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &info)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdatePlaneInfo(info.Id, info.Field, info.Value)
}
