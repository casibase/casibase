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

// GetGlobalFileObjects
// @Title GetGlobalFileObjects
// @Tag FileObject API
// @Description get global file objects
// @Success 200 {array} object.FileObject The Response object
// @router /get-global-file-objects [get]
func (c *ApiController) GetGlobalFileObjects() {
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		fileObjects, err := object.GetGlobalFileObjects()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileObjects)
	} else {
		if !c.RequireAdmin() {
			return
		}

		limit := util.ParseInt(limit)
		count, err := object.GetFileObjectCount("", field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		fileObjects, err := object.GetPaginationFileObjects("", paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(fileObjects, paginator.Nums())
	}
}

// GetFileObjects
// @Title GetFileObjects
// @Tag FileObject API
// @Description get file objects
// @Param owner query string true "The owner of the file object"
// @Success 200 {array} object.FileObject The Response object
// @router /get-file-objects [get]
func (c *ApiController) GetFileObjects() {
	owner := c.Input().Get("owner")
	store := c.Input().Get("store")

	var fileObjects []*object.FileObject
	var err error
	if store != "" {
		fileObjects, err = object.GetFileObjectsByStore(owner, store)
	} else {
		fileObjects, err = object.GetFileObjects(owner)
	}
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileObjects)
}

// GetFileObject
// @Title GetFileObject
// @Tag FileObject API
// @Description get file object
// @Param id query string true "The id (owner/name) of the file object"
// @Success 200 {object} object.FileObject The Response object
// @router /get-file-object [get]
func (c *ApiController) GetFileObject() {
	id := c.Input().Get("id")

	fileObject, err := object.GetFileObject(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(fileObject)
}

// UpdateFileObject
// @Title UpdateFileObject
// @Tag FileObject API
// @Description update file object
// @Param id   query string       true "The id (owner/name) of the file object"
// @Param body body  object.FileObject true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /update-file-object [post]
func (c *ApiController) UpdateFileObject() {
	id := c.Input().Get("id")

	var fileObject object.FileObject
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateFileObject(id, &fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddFileObject
// @Title AddFileObject
// @Tag FileObject API
// @Description add file object
// @Param body body object.FileObject true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /add-file-object [post]
func (c *ApiController) AddFileObject() {
	var fileObject object.FileObject
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddFileObject(&fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteFileObject
// @Title DeleteFileObject
// @Tag FileObject API
// @Description delete file object
// @Param body body object.FileObject true "The details of the file object"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-file-object [post]
func (c *ApiController) DeleteFileObject() {
	var fileObject object.FileObject
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteFileObject(&fileObject)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
