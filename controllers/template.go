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

// GetTemplates
// @Title GetTemplates
// @Tag Template API
// @Description get templates
// @Param owner query string true "The owner of templates"
// @Success 200 {array} object.Template The Response object
// @router /get-templates [get]
func (c *ApiController) GetTemplates() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		templates, err := object.GetTemplates(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(templates)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetTemplateCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		templates, err := object.GetPaginationTemplates(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(templates, paginator.Nums())
	}
}

// GetTemplate
// @Title GetTemplate
// @Tag Template API
// @Description get template
// @Param id query string true "The id of template"
// @Success 200 {object} object.Template The Response object
// @router /get-template [get]
func (c *ApiController) GetTemplate() {
	id := c.Input().Get("id")

	res, err := object.GetTemplate(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

// UpdateTemplate
// @Title UpdateTemplate
// @Tag Template API
// @Description update template
// @Param id query string true "The id (owner/name) of the template"
// @Param body body object.Template true "The details of the template"
// @Success 200 {object} controllers.Response The Response object
// @router /update-template [post]
func (c *ApiController) UpdateTemplate() {
	id := c.Input().Get("id")

	var template object.Template
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateTemplate(id, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddTemplate
// @Title AddTemplate
// @Tag Template API
// @Description add template
// @Param body body object.Template true "The details of the template"
// @Success 200 {object} controllers.Response The Response object
// @router /add-template [post]
func (c *ApiController) AddTemplate() {
	var template object.Template
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddTemplate(&template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteTemplate
// @Title DeleteTemplate
// @Tag Template API
// @Description delete template
// @Param body body object.Template true "The details of the template"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-template [post]
func (c *ApiController) DeleteTemplate() {
	var template object.Template
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteTemplate(&template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
