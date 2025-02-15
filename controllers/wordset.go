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

// GetGlobalWordsets
// @Title GetGlobalWordsets
// @Tag Wordset API
// @Description get global wordsets
// @Success 200 {array} object.Wordset The Response object
// @router /get-global-wordsets [get]
func (c *ApiController) GetGlobalWordsets() {
	wordsets, err := object.GetGlobalWordsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

// GetWordsets
// @Title GetWordsets
// @Tag Wordset API
// @Description get wordsets
// @Param owner query string true "The owner of wordsets"
// @Success 200 {array} object.Wordset The Response object
// @router /get-wordsets [get]
func (c *ApiController) GetWordsets() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		wordsets, err := object.GetWordsets(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(wordsets)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetWordsetCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		wordsets, err := object.GetPaginationWordsets(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(wordsets, paginator.Nums())
	}
}

// GetWordset
// @Title GetWordset
// @Tag Wordset API
// @Description get wordset
// @Param id query string true "The id of wordset"
// @Success 200 {object} object.Wordset The Response object
// @router /get-wordset [get]
func (c *ApiController) GetWordset() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

// GetWordsetGraph
// @Title GetWordsetGraph
// @Tag Wordset API
// @Description get wordset graph
// @Param id query string true "The id of wordset"
// @Param clusterNumber query string true "The clusterNumber of wordset"
// @Param distanceLimit query string true "The distanceLimit of wordset"
// @Success 200 {object} object.Graph The Response object
// @router /get-wordset-graph [get]
func (c *ApiController) GetWordsetGraph() {
	id := c.Input().Get("id")
	clusterNumber := util.ParseInt(c.Input().Get("clusterNumber"))
	distanceLimit := util.ParseInt(c.Input().Get("distanceLimit"))

	g, err := object.GetWordsetGraph(id, clusterNumber, distanceLimit)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(g)
}

// GetWordsetMatch
// @Title GetWordsetMatch
// @Tag Wordset API
// @Description get wordset match
// @Param id query string true "The id of wordset"
// @Success 200 {object} object.Wordset The Response object
// @router /get-wordset-match [get]
func (c *ApiController) GetWordsetMatch() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordsetMatch(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

// UpdateWordset
// @Title UpdateWordset
// @Tag Wordset API
// @Description update wordset
// @Param id query string true "The id (owner/name) of the wordset"
// @Param body body object.Wordset true "The details of the role"
// @Success 200 {object} controllers.Response The Response object
// @router /update-wordset [post]
func (c *ApiController) UpdateWordset() {
	id := c.Input().Get("id")

	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateWordset(id, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

// AddWordset
// @Title AddWordset
// @Tag Wordset API
// @Description add wordset
// @Param body body object.Wordset true "The details of the wordset"
// @Success 200 {object} controllers.Response The Response object
// @router /add-wordset [post]
func (c *ApiController) AddWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

// DeleteWordset
// @Title DeleteWordset
// @Tag Wordset API
// @Description delete wordset
// @Param body body object.Wordset true "The details of the wordset"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-wordset [post]
func (c *ApiController) DeleteWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}
