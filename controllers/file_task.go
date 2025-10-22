// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalFileTasks
// @Title GetGlobalFileTasks
// @Tag FileTask API
// @Description get global file tasks
// @Success 200 {array} object.FileTask The Response object
// @router /get-global-file-tasks [get]
func (c *ApiController) GetGlobalFileTasks() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	store := c.Input().Get("store")

	if limit == "" || page == "" {
		fileTasks, err := object.GetGlobalFileTasks()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileTasks)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetFileTaskCount("", store, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		fileTasks, err := object.GetPaginationFileTasks("", store, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileTasks, paginator.Nums())
	}
}

// GetFileTasks
// @Title GetFileTasks
// @Tag FileTask API
// @Description get file tasks
// @Param owner query string true "The owner of the file task"
// @Success 200 {array} object.FileTask The Response object
// @router /get-file-tasks [get]
func (c *ApiController) GetFileTasks() {
	owner := c.Input().Get("owner")
	store := c.Input().Get("store")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		fileTasks, err := object.GetFileTasks(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileTasks)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetFileTaskCount(owner, store, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		fileTasks, err := object.GetPaginationFileTasks(owner, store, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileTasks, paginator.Nums())
	}
}

// GetFileTask
// @Title GetFileTask
// @Tag FileTask API
// @Description get file task
// @Param id query string true "The id (owner/name) of the file task"
// @Success 200 {object} object.FileTask The Response object
// @router /get-file-task [get]
func (c *ApiController) GetFileTask() {
	id := c.Input().Get("id")

	fileTask, err := object.GetFileTask(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileTask)
}

// GetFileTaskByFileKey
// @Title GetFileTaskByFileKey
// @Tag FileTask API
// @Description get file task by file key
// @Param store query string true "The store name"
// @Param fileKey query string true "The file key"
// @Success 200 {object} object.FileTask The Response object
// @router /get-file-task-by-file-key [get]
func (c *ApiController) GetFileTaskByFileKey() {
	store := c.Input().Get("store")
	fileKey := c.Input().Get("fileKey")

	fileTask, err := object.GetFileTaskByFileKey(store, fileKey)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileTask)
}

// UpdateFileTask
// @Title UpdateFileTask
// @Tag FileTask API
// @Description update file task
// @Param id   query string             true "The id (owner/name) of the file task"
// @Param body body  object.FileTask true "The details of the file task"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file-task [post]
func (c *ApiController) UpdateFileTask() {
	id := c.Input().Get("id")

	var fileTask object.FileTask
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateFileTask(id, &fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddFileTask
// @Title AddFileTask
// @Tag FileTask API
// @Description add file task
// @Param body body object.FileTask true "The details of the file task"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file-task [post]
func (c *ApiController) AddFileTask() {
	var fileTask object.FileTask
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddFileTask(&fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteFileTask
// @Title DeleteFileTask
// @Tag FileTask API
// @Description delete file task
// @Param body body object.FileTask true "The details of the file task"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file-task [post]
func (c *ApiController) DeleteFileTask() {
	var fileTask object.FileTask
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteFileTask(&fileTask)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
