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

// GetGlobalGraphs
// @Title GetGlobalGraphs
// @Tag Graph API
// @Description get global graphs
// @Success 200 {array} object.Graph The Response object
// @router /get-global-graphs [get]
func (c *ApiController) GetGlobalGraphs() {
	graphs, err := object.GetGlobalGraphs()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedGraphs(graphs, true))
}

// GetGraphs
// @Title GetGraphs
// @Tag Graph API
// @Description get graphs
// @Param owner query string true "The owner of Graph"
// @Success 200 {array} object.Graph The Response object
// @router /get-graphs [get]
func (c *ApiController) GetGraphs() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		graphs, err := object.GetGraphs(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(object.GetMaskedGraphs(graphs, true))
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetGraphCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		graphs, err := object.GetPaginationGraphs(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(graphs, paginator.Nums())
	}
}

// GetGraph
// @Title GetGraph
// @Tag Graph API
// @Description get Graph
// @Param id query string true "The id (owner/name) of Graph"
// @Success 200 {object} object.Graph The Response object
// @router /get-Graph [get]
func (c *ApiController) GetGraph() {
	id := c.Input().Get("id")

	Graph, err := object.GetGraph(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedGraph(Graph, true))
}

// UpdateGraph
// @Title UpdateGraph
// @Tag Graph API
// @Description update Graph
// @Param id query string true "The id (owner/name) of the Graph"
// @Param body body object.Graph true "The details of the Graph"
// @Success 200 {object} controllers.Response The Response object
// @router /update-Graph [post]
func (c *ApiController) UpdateGraph() {
	id := c.Input().Get("id")

	var Graph object.Graph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateGraph(id, &Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddGraph
// @Title AddGraph
// @Tag Graph API
// @Description add Graph
// @Param body body object.Graph true "The details of the Graph"
// @Success 200 {object} controllers.Response The Response object
// @router /add-Graph [post]
func (c *ApiController) AddGraph() {
	var Graph object.Graph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddGraph(&Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteGraph
// @Title DeleteGraph
// @Tag Graph API
// @Description delete Graph
// @Param body body object.Graph true "The details of the Graph"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-Graph [post]
func (c *ApiController) DeleteGraph() {
	var Graph object.Graph
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteGraph(&Graph)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
