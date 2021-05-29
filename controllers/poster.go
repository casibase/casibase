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

func (c *ApiController) UpdatePoster() {
	var resp Response
	if !object.CheckModIdentity(c.GetSessionUser()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
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

func (c *ApiController) ReadPoster() {
	n := c.Input().Get("id")
	res := object.GetPoster(n)

	c.Data["json"] = res
	c.ServeJSON()
}
