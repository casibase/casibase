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

// GetGlobalFileLists
// @Title GetGlobalFileLists
// @Tag FileList API
// @Description get global file lists
// @Success 200 {array} object.FileList The Response object
// @router /get-global-files [get]
func (c *ApiController) GetGlobalFileLists() {
	_, ok := c.RequireSignedInUser()
	if !ok {
		return
	}

	fileLists, err := object.GetGlobalFileLists()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileLists)
}

// GetFileLists
// @Title GetFileLists
// @Tag FileList API
// @Description get file lists
// @Param owner query string true "The owner of file lists"
// @Param store query string false "The store name to filter by"
// @Param pageSize query string false "The page size"
// @Param p query string false "The page number"
// @Param field query string false "The field to filter by"
// @Param value query string false "The value to filter by"
// @Param sortField query string false "The field to sort by"
// @Param sortOrder query string false "The sort order"
// @Success 200 {array} object.FileList The Response object
// @router /get-files [get]
func (c *ApiController) GetFileLists() {
	owner := c.Input().Get("owner")
	store := c.Input().Get("store")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		fileLists, err := object.GetFileLists(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileLists)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetFileListCount(owner, store, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		fileLists, err := object.GetPaginationFileLists(owner, store, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileLists, paginator.Nums())
	}
}

// GetFileList
// @Title GetFileList
// @Tag FileList API
// @Description get file list
// @Param id query string true "The id (owner/name) of the file list"
// @Success 200 {object} object.FileList The Response object
// @router /get-file [get]
func (c *ApiController) GetFileList() {
	id := c.Input().Get("id")

	fileList, err := object.GetFileList(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileList)
}

// UpdateFileList
// @Title UpdateFileList
// @Tag FileList API
// @Description update file list
// @Param id query string true "The id (owner/name) of the file list"
// @Param body body object.FileList true "The details of the file list"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file [post]
func (c *ApiController) UpdateFileList() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	id := c.Input().Get("id")

	var fileList object.FileList
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.UpdateFileList(id, &fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

// AddFileList
// @Title AddFileList
// @Tag FileList API
// @Description add file list
// @Param body body object.FileList true "The details of the file list"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file [post]
func (c *ApiController) AddFileList() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var fileList object.FileList
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.AddFileList(&fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

// DeleteFileList
// @Title DeleteFileList
// @Tag FileList API
// @Description delete file list
// @Param body body object.FileList true "The details of the file list"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file [post]
func (c *ApiController) DeleteFileList() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var fileList object.FileList
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.DeleteFileList(&fileList)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}
