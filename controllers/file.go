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
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetGlobalFiles
// @Title GetGlobalFiles
// @Tag File API
// @Description get global file objects
// @Success 200 {array} object.File The Response object
// @router /get-global-files [get]
func (c *ApiController) GetGlobalFiles() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		files, err := object.GetGlobalFiles()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(files)
	} else {
		if !c.RequireAdmin() {
			return
		}

		limit := util.ParseInt(limit)
		count, err := object.GetFileCount("", field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		files, err := object.GetPaginationFiles("", paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(files, paginator.Nums())
	}
}

// GetFiles
// @Title GetFiles
// @Tag File API
// @Description get file objects
// @Param owner query string true "The owner of the file object"
// @Success 200 {array} object.File The Response object
// @router /get-files [get]
func (c *ApiController) GetFiles() {
	owner := c.Input().Get("owner")
	store := c.Input().Get("store")

	var files []*object.File
	var err error
	if store != "" {
		files, err = object.GetFilesByStore(owner, store)
	} else {
		files, err = object.GetFiles(owner)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(files)
}

// GetFileMy
// @Title GetFileMy
// @Tag File API
// @Description get file object
// @Param id query string true "The id (owner/name) of the file object"
// @Success 200 {object} object.File The Response object
// @router /get-file [get]
func (c *ApiController) GetFileMy() {
	id := c.Input().Get("id")

	file, err := object.GetFile(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(file)
}

// UpdateFile
// @Title UpdateFile
// @Tag File API
// @Description update file object
// @Param id   query string       true "The id (owner/name) of the file object"
// @Param body body  object.File true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file [post]
func (c *ApiController) UpdateFile() {
	id := c.Input().Get("id")

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateFile(id, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddFile
// @Title AddFile
// @Tag File API
// @Description add file object
// @Param body body object.File true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file [post]
func (c *ApiController) AddFile() {
	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddFile(&file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteFile
// @Title DeleteFile
// @Tag File API
// @Description delete file object
// @Param body body object.File true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file [post]
func (c *ApiController) DeleteFile() {
	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteFile(&file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
