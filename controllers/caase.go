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

// GetCaases
// @Title GetCaases
// @Tag Caase API
// @Description get all caases
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Caase The Response object
// @router /get-caases [get]
func (c *ApiController) GetCaases() {
	user := c.GetSessionUser()
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		caases, err := object.GetMaskedCaases(object.GetCaases(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter cases by user role
		caases = object.FilterCaasesByUser(user, caases)

		c.ResponseOk(caases)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetCaaseCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		caases, err := object.GetMaskedCaases(object.GetPaginationCaases(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter cases by user role
		caases = object.FilterCaasesByUser(user, caases)

		c.ResponseOk(caases, paginator.Nums())
	}
}

// GetCaase
// @Title GetCaase
// @Tag Caase API
// @Description get caase
// @Param   id     query    string  true        "The id ( owner/name ) of the caase"
// @Success 200 {object} object.Caase The Response object
// @router /get-caase [get]
func (c *ApiController) GetCaase() {
	id := c.Input().Get("id")

	caase, err := object.GetMaskedCaase(object.GetCaase(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(caase)
}

// UpdateCaase
// @Title UpdateCaase
// @Tag Caase API
// @Description update caase
// @Param   id     query    string  true        "The id ( owner/name ) of the caase"
// @Param   body    body   object.Caase  true        "The details of the caase"
// @Success 200 {object} controllers.Response The Response object
// @router /update-caase [post]
func (c *ApiController) UpdateCaase() {
	id := c.Input().Get("id")

	var caase object.Caase
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &caase)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateCaase(id, &caase))
	c.ServeJSON()
}

// AddCaase
// @Title AddCaase
// @Tag Caase API
// @Description add a caase
// @Param   body    body   object.Caase  true        "The details of the caase"
// @Success 200 {object} controllers.Response The Response object
// @router /add-caase [post]
func (c *ApiController) AddCaase() {
	var caase object.Caase
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &caase)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddCaase(&caase))
	c.ServeJSON()
}

// DeleteCaase
// @Title DeleteCaase
// @Tag Caase API
// @Description delete a caase
// @Param   body    body   object.Caase  true        "The details of the caase"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-caase [post]
func (c *ApiController) DeleteCaase() {
	var caase object.Caase
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &caase)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteCaase(&caase))
	c.ServeJSON()
}
