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

// @Title UpdatePoster
// @Description update poster message
// @Success 200 {object} controllers.Response The Response object
// @router /update-poster [post]
// @Tag Poster API
func (c *ApiController) UpdatePoster() {
	if c.RequireAdmin() {
		return
	}

	var tempposter object.Poster
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tempposter)
	if err != nil {
		panic(err)
	}
	object.UpdatePoster(tempposter.Id, tempposter)

	c.Data["json"] = Response{Status: "ok", Msg: "success"}
	c.ServeJSON()
}

// @Title ReadPoster
// @Description get poster by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} object.Poster The Response object
// @router /read-poster [get]
// @Tag Poster API
func (c *ApiController) ReadPoster() {
	n := c.Input().Get("id")
	res := object.GetPoster(n)

	c.Data["json"] = res
	c.ServeJSON()
}
