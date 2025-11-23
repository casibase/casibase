// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"strings"

	"github.com/casibase/casibase/object"
)

// UploadFile
// @Title UploadFile
// @Tag File API
// @Description Upload file content to Casdoor storage provider. Accepts base64 encoded file data and stores it in user-specific directory. File is uploaded to configured storage provider (local, S3, OSS, etc.). Returns the URL of uploaded file. Requires user authentication.
// @Param   file    formData    string  true    "Base64 encoded file data with data URI scheme, e.g., 'data:image/png;base64,iVBORw0KGgo...'"
// @Param   type    formData    string  true    "File type/extension without dot, e.g., 'pdf', 'png', 'docx'"
// @Param   name    formData    string  true    "Original filename with extension, e.g., 'document.pdf'"
// @Success 200 {string} string "Successfully uploaded file, returns storage URL string"
// @Failure 400 {object} controllers.Response "Bad request: Missing required parameters, invalid file data format, or file too large"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to decode file data or upload to storage"
// @router /upload-file [post]
func (c *ApiController) UploadFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	fileBase64 := c.Input().Get("file")
	fileType := c.Input().Get("type")
	fileName := c.Input().Get("name")

	if fileBase64 == "" || fileType == "" || fileName == "" {
		c.ResponseError(c.T("resource:Missing required parameters"))
		return
	}

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

	filePath := fmt.Sprintf("casibase/avatars/%s/%s", userName, fileName)

	fileUrl, err := object.UploadFileToStorageSafe(userName, "file", "UploadStoreAvatar", filePath, fileBytes)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileUrl)
}
