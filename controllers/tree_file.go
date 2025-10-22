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

// UpdateTreeFile
// @Title UpdateTreeFile
// @Tag Tree File API
// @Description update tree file
// @Param storeId query string true "The store id of the file"
// @Param key query string true "The key of the file"
// @Param body body object.TreeFile true "The details of the Tree File"
// @Success 200 {object} controllers.Response The Response object
// @router /update-tree-file [post]
func (c *ApiController) UpdateTreeFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")

	var file object.TreeFile
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res := object.UpdateTreeFile(storeId, key, &file)
	if res {
		err = addRecordForFile(c, userName, "Update", storeId, key, "", true, c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}

// AddTreeFile
// @Title AddTreeFile
// @Tag Tree File API
// @Description add tree file
// @Param store query string true "The store of the file"
// @Param key query string true "The key of the file"
// @Param isLeaf query string true "if is leaf"
// @Param filename query string true "The name of the file"
// @Success 200 {object} controllers.Response The Response object
// @router /add-tree-file [post]
func (c *ApiController) AddTreeFile() {
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

	res, bs, err := object.AddTreeFile(storeId, userName, key, isLeaf, filename, file, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		err = addFileToCache(key, filename, bs)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		err = addRecordForFile(c, userName, "Add", storeId, key, filename, isLeaf, c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}

// DeleteTreeFile
// @Title DeleteTreeFile
// @Tag Tree File API
// @Description delete tree file
// @Param store query string true "The store of the file"
// @Param key query string true "The key of the file"
// @Param isLeaf query string true "if is leaf"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-tree-file [post]
func (c *ApiController) DeleteTreeFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"

	res, err := object.DeleteTreeFile(storeId, key, isLeaf, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		err = addRecordForFile(c, userName, "Delete", storeId, key, "", isLeaf, c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}
