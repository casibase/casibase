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

// GetGlobalVectors
// @Title GetGlobalVectors
// @Tag Vector API
// @Description Get all global vector embeddings stored in the system. Vectors represent semantic embeddings of text chunks, files, and documents used for RAG (Retrieval Augmented Generation) and similarity search. Each vector contains embedding data, text content, and metadata.
// @Success 200 {array} object.Vector "Successfully returns array of vector objects with embeddings and metadata"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve vectors"
// @router /get-global-vectors [get]
func (c *ApiController) GetGlobalVectors() {
	vectors, err := object.GetGlobalVectors()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectors)
}

// GetVectors
// @Title GetVectors
// @Tag Vector API
// @Description Get vector embeddings for admin owner with optional pagination, filtering and store isolation. When pageSize and p parameters are provided, returns paginated results. Store isolation is enforced based on user's homepage field. Vectors are used for semantic search and RAG functionality.
// @Param   store        query    string  false   "Filter by store name for store isolation"
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'dataType'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'text'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Success 200 {array} object.Vector "Successfully returns array of vector objects with optional pagination info"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Store isolation violation"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve vectors"
// @router /get-vectors [get]
func (c *ApiController) GetVectors() {
	owner := "admin"
	storeName := c.Input().Get("store")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	// Apply store isolation based on user's Homepage field
	var ok bool
	storeName, ok = c.EnforceStoreIsolation(storeName)
	if !ok {
		return
	}

	if limit == "" || page == "" {
		vectors, err := object.GetVectors(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(vectors)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetVectorCount(owner, storeName, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		vectors, err := object.GetPaginationVectors(owner, storeName, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(vectors, paginator.Nums())
	}
}

// GetVector
// @Title GetVector
// @Tag Vector API
// @Description Get detailed information of a specific vector embedding including embedding data, text content, file reference, data type, and metadata. Vectors represent semantic embeddings used for similarity search and RAG.
// @Param   id    query    string  true    "Vector ID in format 'owner/name', e.g., 'admin/vector-123abc'"
// @Success 200 {object} object.Vector "Successfully returns vector object with embedding data and metadata"
// @Failure 400 {object} controllers.Response "Bad request: Invalid vector ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this vector"
// @Failure 404 {object} controllers.Response "Not found: Vector does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve vector"
// @router /get-vector [get]
func (c *ApiController) GetVector() {
	id := c.Input().Get("id")

	vector, err := object.GetVector(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vector)
}

// UpdateVector
// @Title UpdateVector
// @Tag Vector API
// @Description Update vector embedding metadata including text content, file reference, data type, and store association. Can regenerate embedding if text content changes. Used to maintain vector index for semantic search. Requires appropriate permissions.
// @Param   id      query    string          true    "Vector ID in format 'owner/name', e.g., 'admin/vector-123abc'"
// @Param   body    body     object.Vector   true    "Vector object with updated fields including text, file, dataType, store, provider, etc."
// @Success 200 {object} controllers.Response "Successfully updated vector, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid vector data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update vector"
// @Failure 404 {object} controllers.Response "Not found: Vector does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update vector or regenerate embedding"
// @router /update-vector [post]
func (c *ApiController) UpdateVector() {
	id := c.Input().Get("id")

	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVector(id, &vector, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddVector
// @Title AddVector
// @Tag Vector API
// @Description Create new vector embedding for text content or file chunk. Automatically generates embedding using configured embedding provider (OpenAI, Azure, etc.) if not provided. Vectors are stored for semantic search and RAG functionality. Uses default embedding provider if not specified. Requires appropriate permissions.
// @Param   body    body    object.Vector    true    "Vector object with required fields: owner, name, text (content to embed), store, and optional fields: file, dataType, provider, embedding data, etc."
// @Success 200 {object} controllers.Response "Successfully created vector embedding, returns success status and vector ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid vector data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create vector"
// @Failure 404 {object} controllers.Response "Not found: Embedding provider not configured"
// @Failure 409 {object} controllers.Response "Conflict: Vector with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create vector or generate embedding"
// @router /add-vector [post]
func (c *ApiController) AddVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if vector.Provider == "" {
		var embeddingProvider *object.Provider
		embeddingProvider, err = object.GetDefaultEmbeddingProvider()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if embeddingProvider != nil {
			vector.Provider = embeddingProvider.Name
		}
	}

	success, err := object.AddVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteVector
// @Title DeleteVector
// @Tag Vector API
// @Description Delete a vector embedding from the system. This removes the vector from semantic search index and frees up storage. Deleting vectors may affect RAG quality if they contain important context. Requires appropriate permissions.
// @Param   body    body    object.Vector    true    "Vector object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted vector, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid vector data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete vector"
// @Failure 404 {object} controllers.Response "Not found: Vector does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete vector"
// @router /delete-vector [post]
func (c *ApiController) DeleteVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteAllVectors
// @Title DeleteAllVectors
// @Tag Vector API
// @Description Delete all vector embeddings for admin owner. This operation is irreversible and removes all vectors from semantic search index. Use with extreme caution as it will break all RAG functionality until vectors are regenerated. Requires admin permissions.
// @Success 200 {object} controllers.Response "Successfully deleted all vectors, returns true if all deletions succeeded, false if any failed"
// @Failure 401 {object} controllers.Response "Unauthorized: Admin login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient admin permissions"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete some or all vectors"
// @router /delete-all-vectors [post]
func (c *ApiController) DeleteAllVectors() {
	owner := "admin"

	vectors, err := object.GetVectors(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	allSuccess := true
	for i := range vectors {
		success, err := object.DeleteVector(vectors[i])
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		if !success {
			allSuccess = false
		}
	}

	c.ResponseOk(allSuccess)
}
