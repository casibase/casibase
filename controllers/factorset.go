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

// GetGlobalFactorsets
// @Title GetGlobalFactorSets
// @Tag Factorset API
// @Description get global factorsets
// @Success 200 {array} object.Factorset The Response object
// @router /get-global-factorsets [get]
func (c *ApiController) GetGlobalFactorsets() {
	factorsets, err := object.GetGlobalFactorsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorsets)
}

// GetFactorsets
// @Title GetFactorsets
// @Tag Factorset API
// @Description get factorsets
// @Param owner query string true "The owner of factorsets"
// @Success 200 {array} object.Factorset The Response object
// @router /get-factorsets [get]
func (c *ApiController) GetFactorsets() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		factorsets, err := object.GetFactorsets(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(factorsets)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetFactorsetCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		factorsets, err := object.GetPaginationFactorsets(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(factorsets, paginator.Nums())
	}
}

// GetFactorset
// @Title GetFactorset
// @Tag Factorset API
// @Description get factorset
// @Param id query string true "The id of factorset"
// @Success 200 {object} object.Factorset The Response object
// @router /get-factorset [get]
func (c *ApiController) GetFactorset() {
	id := c.Input().Get("id")

	factorset, err := object.GetFactorset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(factorset)
}

// UpdateFactorset
// @Title UpdateFactorset
// @Tag Factorset API
// @Description update factorset
// @Param id query string true "The id (owner/name) of the factorset"
// @Param body body object.Factorset true "The details of the factorset"
// @Success 200 {object} controllers.Response The Response object
// @router /update-factorset [post]
func (c *ApiController) UpdateFactorset() {
	id := c.Input().Get("id")

	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateFactorset(id, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddFactorset
// @Title AddFactorset
// @Tag Factorset API
// @Description add factorset
// @Param body body object.Factorset true "The details of the factorset"
// @Success 200 {object} controllers.Response The Response object
// @router /add-factorset [post]
func (c *ApiController) AddFactorset() {
	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddFactorset(&factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteFactorset
// @Title DeleteFactorset
// @Tag Factorset API
// @Description delete factorset
// @Param body body object.Factorset true "The details of the factorset"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-factorset [post]
func (c *ApiController) DeleteFactorset() {
	var factorset object.Factorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteFactorset(&factorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
