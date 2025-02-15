// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

// GetNodes
// @Title GetNodes
// @Tag Node API
// @Description get all nodes
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Node The Response object
// @router /get-nodes [get]
func (c *ApiController) GetNodes() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		nodes, err := object.GetMaskedNodes(object.GetNodes(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(nodes)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetNodeCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		nodes, err := object.GetMaskedNodes(object.GetPaginationNodes(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(nodes, paginator.Nums())
	}
}

// GetNode
// @Title GetNode
// @Tag Node API
// @Description get node
// @Param   id     query    string  true        "The id ( owner/name ) of the node"
// @Success 200 {object} object.Node The Response object
// @router /get-node [get]
func (c *ApiController) GetNode() {
	id := c.Input().Get("id")

	node, err := object.GetMaskedNode(object.GetNode(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(node)
}

// UpdateNode
// @Title UpdateNode
// @Tag Node API
// @Description update node
// @Param   id     query    string  true        "The id ( owner/name ) of the node"
// @Param   body    body   object.Node  true        "The details of the node"
// @Success 200 {object} controllers.Response The Response object
// @router /update-node [post]
func (c *ApiController) UpdateNode() {
	id := c.Input().Get("id")

	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateNode(id, &node))
	c.ServeJSON()
}

// AddNode
// @Title AddNode
// @Tag Node API
// @Description add a node
// @Param   body    body   object.Node  true        "The details of the node"
// @Success 200 {object} controllers.Response The Response object
// @router /add-node [post]
func (c *ApiController) AddNode() {
	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddNode(&node))
	c.ServeJSON()
}

// DeleteNode
// @Title DeleteNode
// @Tag Node API
// @Description delete a node
// @Param   body    body   object.Node  true        "The details of the node"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-node [post]
func (c *ApiController) DeleteNode() {
	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteNode(&node))
	c.ServeJSON()
}
