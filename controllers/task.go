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
// @Title Get Global Tasks
// @Tag Task API
// @Description Retrieves all global tasks from the database.
// @Success 200 {object} []Task "An array of global tasks."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database."
// @router /tasks/global [get]
func (c *ApiController) GetGlobalTasks() {
	tasks, err := object.GetGlobalTasks()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedTasks(tasks, true))
}

// GetTasks
// @Title Get Tasks
// @Tag Task API
// @Description Retrieves tasks belonging to a specific owner from the database.
// @Param owner query string true "The owner of the tasks."
// @Success 200 {object} []Task "An array of tasks belonging to the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /tasks [get]
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
// @Title Get Task
// @Tag Task API
// @Description Retrieves a specific task from the database.
// @Param id query string true "The ID of the task to retrieve."
// @Success 200 {object} Task "The task with the specified ID."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /task [get]
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
// @Title Update Task
// @Tag Task API
// @Description Updates a specific task in the database.
// @Param id query string true "The ID of the task to update."
// @Param task body Task true "The updated task data."
// @Success 200 {boolean} bool "True if the task was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /task [put]
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
// @Title Add Task
// @Tag Task API
// @Description Adds a new task to the database.
// @Param task body Task true "The task data to be added."
// @Success 200 {boolean} bool "True if the task was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /task [post]
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
// @Title Delete Task
// @Tag Task API
// @Description Deletes a specific task from the database.
// @Param task body Task true "The task data to be deleted."
// @Success 200 {boolean} bool "True if the task was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /task [delete]
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
