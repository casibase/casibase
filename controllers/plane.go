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

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

func (c *ApiController) GetPlanes() {
	c.Data["json"] = object.GetPlanes()
	c.ServeJSON()
}

// @Title GetPlanesAdmin
// @router /get-planes-admin [get]
// @Tag Plane API
func (c *ApiController) GetPlanesAdmin() {
	c.Data["json"] = object.GetAllPlanes()
	c.ServeJSON()
}

// @Title GetPlane
// @router /get-plane [get]
// @Tag Plane API
func (c *ApiController) GetPlane() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetPlane(id)
	c.ServeJSON()
}

// @Title GetPlaneAdmin
// @router /get-planes-admin [get]
// @Tag Plane API
func (c *ApiController) GetPlaneAdmin() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetPlaneAdmin(id)
	c.ServeJSON()
}

// @Title GetPlaneLis
// @router /get-plane-list [get]
// @Tag Plane API
func (c *ApiController) GetPlaneList() {
	c.ResponseOk(object.GetPlaneList())
}

// @Title AddPlane
// @router /add-plane [post]
// @Tag Plane API
func (c *ApiController) AddPlane() {
	if c.RequireAdmin() {
		return
	}

	var plane object.AdminPlaneInfo
	var resp Response

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &plane)
	if err != nil {
		panic(err)
	}

	if plane.Id == "" || plane.Name == "" {
		resp = Response{Status: "fail", Msg: "Some information is missing"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if object.HasPlane(plane.Id) {
		resp = Response{Status: "fail", Msg: "Plane ID existed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	newPlane := object.Plane{
		Id:              plane.Id,
		Name:            plane.Name,
		Sorter:          plane.Sorter,
		CreatedTime:     util.GetCurrentTime(),
		Image:           plane.Image,
		BackgroundColor: plane.BackgroundColor,
		Color:           plane.Color,
		Visible:         plane.Visible,
	}
	res := object.AddPlane(&newPlane)
	c.ResponseOk(res)
}

// @Title UpdatePlane
// @router /update-plane [post]
// @Tag Plane API
func (c *ApiController) UpdatePlane() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")

	var plane object.AdminPlaneInfo

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &plane)
	if err != nil {
		panic(err)
	}
	newPlane := object.Plane{
		Id:              plane.Id,
		Name:            plane.Name,
		Sorter:          plane.Sorter,
		CreatedTime:     plane.CreatedTime,
		Image:           plane.Image,
		BackgroundColor: plane.BackgroundColor,
		Color:           plane.Color,
		Visible:         plane.Visible,
	}
	res := object.UpdatePlane(id, &newPlane)
	c.ResponseOk(res)
}

// @Title DeletePlane
// @router /delete-plane [post]
// @Tag Plane API
func (c *ApiController) DeletePlane() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: object.DeletePlane(id)}
	c.ServeJSON()
}
