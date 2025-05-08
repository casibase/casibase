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

// GetContainers
// @Title GetContainers
// @Tag Container API
// @Description get all containers
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Container The Response object
// @router /get-containers [get]
func (c *ApiController) GetContainers() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	_, err := object.SyncDockerContainers(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if limit == "" || page == "" {
		containers, err := object.GetMaskedContainers(object.GetContainers(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(containers)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetContainerCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		containers, err := object.GetMaskedContainers(object.GetPaginationContainers(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(containers, paginator.Nums())
	}
}

// GetContainer
// @Title GetContainer
// @Tag Container API
// @Description get container
// @Param   id     query    string  true        "The id ( owner/name ) of the container"
// @Success 200 {object} object.Container The Response object
// @router /get-container [get]
func (c *ApiController) GetContainer() {
	id := c.Input().Get("id")

	owner, _ := util.GetOwnerAndNameFromId(id)
	_, err := object.SyncDockerContainers(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	container, err := object.GetMaskedContainer(object.GetContainer(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(container)
}

// UpdateContainer
// @Title UpdateContainer
// @Tag Container API
// @Description update container
// @Param   id     query    string  true        "The id ( owner/name ) of the container"
// @Param   body    body   object.Container  true        "The details of the container"
// @Success 200 {object} controllers.Response The Response object
// @router /update-container [post]
func (c *ApiController) UpdateContainer() {
	id := c.Input().Get("id")

	var container object.Container
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &container)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.UpdateContainer(id, &container))
}

// AddContainer
// @Title AddContainer
// @Tag Container API
// @Description add a container
// @Param   body    body   object.Container  true        "The details of the container"
// @Success 200 {object} controllers.Response The Response object
// @router /add-container [post]
func (c *ApiController) AddContainer() {
	var container object.Container
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &container)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.AddContainer(&container))
}

// DeleteContainer
// @Title DeleteContainer
// @Tag Container API
// @Description delete a container
// @Param   body    body   object.Container  true        "The details of the container"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-container [post]
func (c *ApiController) DeleteContainer() {
	var container object.Container
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &container)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.DeleteContainer(&container))
}
