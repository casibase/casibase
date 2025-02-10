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
	"mime/multipart"

	"github.com/casibase/casibase/object"
)

// UpdateFile
// @Title UpdateFile
// @Tag File API
// @Description update file
// @Param storeId query string true "The store id of the file"
// @Param key query string true "The key of the file"
// @Param body body object.File true "The details of the File"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file [post]
func (c *ApiController) UpdateFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res := object.UpdateFile(storeId, key, &file)
	if res {
		addRecordForFile(c, userName, "Update", storeId, key, "", true)
	}

	c.ResponseOk(res)
}

// AddFile
// @Title AddFile
// @Tag File API
// @Description add file
// @Param store query string true "The store of the file"
// @Param key query string true "The key of the file"
// @Param isLeaf query string true "if is leaf"
// @Param filename query string true "The name of the file"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file [post]
func (c *ApiController) AddFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"
	filename := c.Input().Get("filename")
	var file multipart.File

	if isLeaf {
		var err error
		file, _, err = c.GetFile("file")
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		defer file.Close()
	}

	res, bs, err := object.AddFile(storeId, userName, key, isLeaf, filename, file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		addFileToCache(key, filename, bs)
		addRecordForFile(c, userName, "Add", storeId, key, filename, isLeaf)
	}

	c.ResponseOk(res)
}

// DeleteFile
// @Title DeleteFile
// @Tag File API
// @Description delete file
// @Param store query string true "The store of the file"
// @Param key query string true "The key of the file"
// @Param isLeaf query string true "if is leaf"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file [post]
func (c *ApiController) DeleteFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"

	res, err := object.DeleteFile(storeId, key, isLeaf)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		addRecordForFile(c, userName, "Delete", storeId, key, "", isLeaf)
	}

	c.ResponseOk(res)
}
