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

func (c *APIController) GetBoards() {
	c.Data["json"] = object.GetBoards()
	c.ServeJSON()
}

func (c *APIController) GetBoard() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetBoard(id)
	c.ServeJSON()
}

func (c *APIController) UpdateBoard() {
	id := c.Input().Get("id")

	var board object.Board
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &board)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateBoard(id, &board)
	c.ServeJSON()
}

func (c *APIController) AddBoard() {
	var board object.Board
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &board)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddBoard(&board)
	c.ServeJSON()
}

func (c *APIController) DeleteBoard() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteBoard(id)
	c.ServeJSON()
}
