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

func (c *APIController) GetNodes() {
	c.Data["json"] = object.GetNodes()
	c.ServeJSON()
}

func (c *APIController) GetNode() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetNode(id)
	c.ServeJSON()
}

func (c *APIController) UpdateNode() {
	id := c.Input().Get("id")

	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateNode(id, &node)
	c.ServeJSON()
}

func (c *APIController) AddNode() {
	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddNode(&node)
	c.ServeJSON()
}

func (c *APIController) DeleteNode() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteNode(id)
	c.ServeJSON()
}

func (c *APIController) GetNodeInfo() {
	id := c.Input().Get("id")

	var resp Response
	num := object.GetNodeTopicNum(id)
	favoriteNum := object.GetNodeFavoritesNum(id)
	resp = Response{Status: "ok", Msg: "success", Data: num, Data2: favoriteNum}

	c.Data["json"] = resp
	c.ServeJSON()
}
