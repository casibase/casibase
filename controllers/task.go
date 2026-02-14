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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/txt"
	"github.com/casibase/casibase/util"
)

// GetGlobalTasks
// @Title GetGlobalTasks
// @Tag Task API
// @Description get global tasks
// @Success 200 {array} object.Task The Response object
// @router /get-global-tasks [get]
func (c *ApiController) GetGlobalTasks() {
	owner := c.GetSessionUsername()
	if c.IsAdmin() {
		owner = ""
	}

	tasks, err := object.GetGlobalTasks(owner)
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
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if c.IsAdmin() {
		owner = ""
	}

	// For non-admins, filter by their username
	if !c.IsAdmin() {
		username := c.GetSessionUsername()
		if username != "" {
			owner = username
		}
	}

	if limit == "" || page == "" {
		tasks, err := object.GetTasks(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(object.GetMaskedTasks(tasks, true))
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetTaskCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		tasks, err := object.GetPaginationTasks(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(tasks, paginator.Nums())
	}
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

	// Check if task exists
	if task == nil {
		c.ResponseError(c.T("general:The task does not exist"))
		return
	}

	// Check ownership for non-admins
	if !c.IsAdmin() && !c.IsPreviewMode() {
		username := c.GetSessionUsername()
		if task.Owner != username {
			c.ResponseError(c.T("auth:Unauthorized operation"))
			return
		}
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

	// Check ownership for non-admins
	if !c.IsAdmin() && !c.IsPreviewMode() {
		username := c.GetSessionUsername()
		existingTask, err := object.GetTask(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if existingTask == nil {
			c.ResponseError(c.T("general:The task does not exist"))
			return
		}
		if existingTask.Owner != username {
			c.ResponseError(c.T("auth:Unauthorized operation"))
			return
		}
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

	// Check ownership for non-admins
	if !c.IsAdmin() {
		username := c.GetSessionUsername()
		// Fetch task from database to verify ownership
		id := task.GetId()
		existingTask, err := object.GetTask(id)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if existingTask == nil {
			c.ResponseError(c.T("general:The task does not exist"))
			return
		}
		if existingTask.Owner != username {
			c.ResponseError(c.T("auth:Unauthorized operation"))
			return
		}
	}

	success, err := object.DeleteTask(&task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// UploadTaskDocument
// @Title UploadTaskDocument
// @Tag Task API
// @Description upload document for a task and parse its text
// @Param id query string true "The id (owner/name) of the task"
// @Param file formData string true "The base64 encoded file data"
// @Param type formData string true "The file type/extension"
// @Param name formData string true "The file name"
// @Success 200 {object} controllers.Response The Response object
// @router /upload-task-document [post]
func (c *ApiController) UploadTaskDocument() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	taskId := c.Input().Get("id")
	fileBase64 := c.Input().Get("file")
	fileType := c.Input().Get("type")
	fileName := c.Input().Get("name")

	if taskId == "" || fileBase64 == "" || fileType == "" || fileName == "" {
		c.ResponseError(c.T("resource:Missing required parameters"))
		return
	}

	// Get the task to verify ownership
	task, err := object.GetTask(taskId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if task == nil {
		c.ResponseError(c.T("general:The task does not exist"))
		return
	}

	// Check ownership for non-admins
	if !c.IsAdmin() {
		if task.Owner != userName {
			c.ResponseError(c.T("auth:Unauthorized operation"))
			return
		}
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileName))
	allowedExtensions := []string{".doc", ".docx", ".pdf"}
	isValid := false
	for _, allowed := range allowedExtensions {
		if ext == allowed {
			isValid = true
			break
		}
	}
	if !isValid {
		c.ResponseError(c.T("resource:Only doc, docx, and pdf files are allowed"))
		return
	}

	// Decode base64 file data
	index := strings.Index(fileBase64, ",")
	if index == -1 {
		c.ResponseError(c.T("resource:Invalid file data format"))
		return
	}

	fileBytes, err := base64.StdEncoding.DecodeString(fileBase64[index+1:])
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Upload file to storage
	filePath := fmt.Sprintf("casibase/task-documents/%s/%s", userName, fileName)
	fileUrl, err := object.UploadFileToStorageSafe(userName, "file", "UploadTaskDocument", filePath, fileBytes)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Parse document text
	// Note: .doc is not directly supported by txt package, only .docx
	// For .doc files, we'll skip text extraction
	var documentText string
	if ext != ".doc" {
		documentText, err = txt.GetParsedTextFromUrl(fileUrl, ext, c.GetAcceptLanguage())
		if err != nil {
			// Log error but don't fail the upload
			// Just set documentText to empty string
			documentText = ""
		}
	}

	// Update task with document URL and text
	task.Document = fileUrl
	task.DocumentText = documentText

	success, err := object.UpdateTask(taskId, task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Return both URL and parsed text
	result := map[string]interface{}{
		"url":  fileUrl,
		"text": documentText,
	}
	c.ResponseOk(result, success)
}

