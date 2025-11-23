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
// @Description Get all global file metadata with optional pagination, filtering and sorting. Files represent documents, images, videos, and other content stored in stores for RAG and knowledge base. When pageSize and p parameters are provided, returns paginated results with admin permission check. Supports filtering and sorting by various fields.
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'type'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'pdf'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Success 200 {array} object.File "Successfully returns array of file metadata objects with optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Admin login required for paginated access"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient admin permissions"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve files"
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
// @Description Get file metadata for a specific owner with optional store filtering. Returns file objects representing documents, images, videos, and other content stored in knowledge bases. Use store parameter to filter files by specific store.
// @Param   owner    query    string  true    "Owner of the files, typically 'admin', e.g., 'admin'"
// @Param   store    query    string  false   "Filter by store name to get files from specific store, e.g., 'store-built-in'"
// @Success 200 {array} object.File "Successfully returns array of file metadata objects"
// @Failure 400 {object} controllers.Response "Bad request: Invalid owner parameter"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve files"
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
// @Description Get detailed metadata of a specific file including filename, size, type, upload time, processing status, vector embeddings, and storage location. Files represent documents and content stored in knowledge bases for semantic search and RAG.
// @Param   id    query    string  true    "File ID in format 'owner/name', e.g., 'admin/file-123abc'"
// @Success 200 {object} object.File "Successfully returns file metadata object with all details"
// @Failure 400 {object} controllers.Response "Bad request: Invalid file ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this file"
// @Failure 404 {object} controllers.Response "Not found: File does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve file"
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
// @Description Update file metadata including filename, display name, description, tags, processing status, and store association. Does not update file content - use upload endpoints to replace file content. Requires appropriate permissions.
// @Param   id      query    string        true    "File ID in format 'owner/name', e.g., 'admin/file-123abc'"
// @Param   body    body     object.File   true    "File metadata object with updated fields including name, displayName, description, tags, store, etc."
// @Success 200 {object} controllers.Response "Successfully updated file metadata, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid file data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update file"
// @Failure 404 {object} controllers.Response "Not found: File does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update file"
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
// @Description Create new file metadata record for uploaded content. This registers file in the system for vector embedding and knowledge base indexing. File content should be uploaded separately via upload endpoint. Automatically triggers vector generation for RAG if store is configured. Requires appropriate permissions.
// @Param   body    body    object.File    true    "File metadata object with required fields: owner, name, filename, fileType, size, store, and optional fields: displayName, description, tags, etc."
// @Success 200 {object} controllers.Response "Successfully created file record, returns success status and file ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid file data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create file"
// @Failure 409 {object} controllers.Response "Conflict: File with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create file or generate vectors"
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
// @Description Delete file metadata and associated data including vectors, embeddings, and storage content. This operation is irreversible and removes the file from knowledge base and search index. Requires appropriate permissions.
// @Param   body    body    object.File    true    "File object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted file and associated data, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid file data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete file"
// @Failure 404 {object} controllers.Response "Not found: File does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete file or clean up storage"
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
