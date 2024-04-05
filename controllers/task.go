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

// GetGlobalTasks
// @Title GetGlobalTasks
// @Tag Task API
// @Description get global tasks
// @Success 200 {array} object.Task The Response object
// @router /get-global-tasks [get]
func (c *ApiController) GetGlobalTasks() {
	tasks, err := object.GetGlobalTasks()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTasks(tasks, true))
}

// GetTasks
// @Title GetTasks
// @Tag Task API
// @Description get tasks
// @Param owner query string true "The owner of task"
// @Success 200 {array} object.Task The Response object
// @router /get-tasks [get]
func (c *ApiController) GetTasks() {
	owner := c.Input().Get("owner")

	tasks, err := object.GetTasks(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTasks(tasks, true))
}

// GetTask
// @Title GetTask
// @Tag Task API
// @Description get task
// @Param id query string true "The id (owner/name) of task"
// @Success 200 {object} object.Task The Response object
// @router /get-task [get]
func (c *ApiController) GetTask() {
	id := c.Input().Get("id")

	task, err := object.GetTask(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTask(task, true))
}

// UpdateTask
// @Title UpdateTask
// @Tag Task API
// @Description update task
// @Param id query string true "The id (owner/name) of the task"
// @Param body body object.Task true "The details of the task"
// @Success 200 {object} controllers.Response The Response object
// @router /update-task [post]
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

// AddTask
// @Title AddTask
// @Tag Task API
// @Description add task
// @Param body body object.Task true "The details of the task"
// @Success 200 {object} controllers.Response The Response object
// @router /add-task [post]
func (c *ApiController) AddTask() {
	var task object.Task
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddTask(&task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteTask
// @Title DeleteTask
// @Tag Task API
// @Description delete task
// @Param body body object.Task true "The details of the task"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-task [post]
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
