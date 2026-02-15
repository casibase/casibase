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
// @Description upload file to casdoor storage
// @Param file formData string true "The base64 encoded file data"
// @Param type formData string true "The file type/extension"
// @Param name formData string true "The file name"
// @Success 200 {object} controllers.Response The Response object
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
		c.ResponseError(c.T("application:Missing required parameters"))
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
