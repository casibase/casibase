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

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/util/pagination"
)

// GetGlobalFilesData
// @Title GetGlobalFilesData
// @Tag FileData API
// @Description get global files data
// @Success 200 {array} object.FileData The Response object
// @router /get-global-files-data [get]
func (c *ApiController) GetGlobalFilesData() {
	_, ok := c.RequireSignedInUser()
	if !ok {
		return
	}

	filesData, err := object.GetGlobalFilesData()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(filesData)
}

// GetFilesData
// @Title GetFilesData
// @Tag FileData API
// @Description get files data
// @Param owner query string true "The owner of files data"
// @Param store query string false "The store name to filter by"
// @Param pageSize query string false "The page size"
// @Param p query string false "The page number"
// @Param field query string false "The field to filter by"
// @Param value query string false "The value to filter by"
// @Param sortField query string false "The field to sort by"
// @Param sortOrder query string false "The sort order"
// @Success 200 {array} object.FileData The Response object
// @router /get-files-data [get]
func (c *ApiController) GetFilesData() {
	owner := c.Input().Get("owner")
	store := c.Input().Get("store")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		filesData, err := object.GetFilesData(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(filesData)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetFileDataCount(owner, store, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		filesData, err := object.GetPaginationFilesData(owner, store, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(filesData, paginator.Nums())
	}
}

// GetFileData
// @Title GetFileData
// @Tag FileData API
// @Description get file data
// @Param id query string true "The id (owner/name) of the file data"
// @Success 200 {object} object.FileData The Response object
// @router /get-file-data [get]
func (c *ApiController) GetFileData() {
	id := c.Input().Get("id")

	fileData, err := object.GetFileData(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileData)
}

// UpdateFileData
// @Title UpdateFileData
// @Tag FileData API
// @Description update file data
// @Param id query string true "The id (owner/name) of the file data"
// @Param body body object.FileData true "The details of the file data"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file-data [post]
func (c *ApiController) UpdateFileData() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	id := c.Input().Get("id")

	var fileData object.FileData
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.UpdateFileData(id, &fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		err = addRecordForObject(c, "Update", "file-data", fileData.GetId(), userName, "", "", c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}

// AddFileData
// @Title AddFileData
// @Tag FileData API
// @Description add file data
// @Param body body object.FileData true "The details of the file data"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file-data [post]
func (c *ApiController) AddFileData() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var fileData object.FileData
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.AddFileData(&fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		err = addRecordForObject(c, "Add", "file-data", fileData.GetId(), userName, "", "", c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}

// DeleteFileData
// @Title DeleteFileData
// @Tag FileData API
// @Description delete file data
// @Param body body object.FileData true "The details of the file data"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file-data [post]
func (c *ApiController) DeleteFileData() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var fileData object.FileData
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	res, err := object.DeleteFileData(&fileData)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		err = addRecordForObject(c, "Delete", "file-data", fileData.GetId(), userName, "", "", c.GetAcceptLanguage())
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(res)
}
