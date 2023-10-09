// Copyright 2023 The casbin Authors. All Rights Reserved.
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

	"github.com/casibase/casibase/object"
)

func (c *ApiController) GetGlobalTasks() {
	tasks, err := object.GetGlobalTasks()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTasks(tasks, true))
}

func (c *ApiController) GetTasks() {
	owner := "admin"

	tasks, err := object.GetTasks(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTasks(tasks, true))
}

func (c *ApiController) GetTask() {
	id := c.Input().Get("id")

	task, err := object.GetTask(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTask(task, true))
}

func (c *ApiController) UpdateTask() {
	id := c.Input().Get("id")

	var task object.Task
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateTask(id, &task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddTask() {
	var task object.Task
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	task.Owner = "admin"
	success, err := object.AddTask(&task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteTask() {
	var task object.Task
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteTask(&task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
