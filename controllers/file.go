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
	"mime/multipart"

	"github.com/casibase/casibase/object"
)

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
