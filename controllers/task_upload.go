// Copyright 2026 The Casibase Authors. All Rights Reserved.
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
	"fmt"
	"path/filepath"
	"strings"

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/txt"
)

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
	fileBase64 := c.GetString("file")
	fileType := c.GetString("type")
	fileName := c.GetString("name")

	if taskId == "" || fileBase64 == "" || fileType == "" || fileName == "" {
		c.ResponseError(c.T("application:Missing required parameters"))
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

	// Validate file extension - only .docx and .pdf allowed
	ext := strings.ToLower(filepath.Ext(fileName))
	allowedExtensions := []string{".docx", ".pdf"}
	isValid := false
	for _, allowed := range allowedExtensions {
		if ext == allowed {
			isValid = true
			break
		}
	}
	if !isValid {
		c.ResponseError(c.T("resource:Only docx and pdf files are allowed"))
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
	documentText, err := txt.GetParsedTextFromUrl(fileUrl, ext, c.GetAcceptLanguage())
	if err != nil {
		// Log error but don't fail the upload
		logs.Error("Failed to parse text from %s: %v", fileUrl, err)
		documentText = ""
	}

	// Update task with document URL and text
	task.DocumentUrl = fileUrl
	task.DocumentText = documentText

	success, err := object.UpdateTask(taskId, task)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if !success {
		c.ResponseError(c.T("general:Failed to update"))
		return
	}

	// Return both URL and parsed text
	result := map[string]interface{}{
		"url":  fileUrl,
		"text": documentText,
	}
	c.ResponseOk(result)
}
