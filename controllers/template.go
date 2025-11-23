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
// @Description Get templates for a specific owner with optional pagination, filtering and sorting. Templates define reusable configurations for applications, workflows, and agents. When pageSize and p parameters are provided, returns paginated results. Supports filtering and sorting by various fields.
// @Param   owner        query    string  true    "Owner of the templates, typically 'admin', e.g., 'admin'"
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'type'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'workflow'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Success 200 {array} object.Template "Successfully returns array of template objects with optional pagination info"
// @Failure 400 {object} controllers.Response "Bad request: Invalid owner parameter"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve templates"
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
// @Description Get detailed information of a specific template including configuration, parameters, and metadata. Templates provide reusable configurations for creating applications, workflows, agents, and other resources with predefined settings.
// @Param   id    query    string  true    "Template ID in format 'owner/name', e.g., 'admin/template-workflow-basic'"
// @Success 200 {object} object.Template "Successfully returns template object with all configuration and metadata"
// @Failure 400 {object} controllers.Response "Bad request: Invalid template ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this template"
// @Failure 404 {object} controllers.Response "Not found: Template does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve template"
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
// @Description Update an existing template's configuration, parameters, and metadata. Templates define reusable settings that can be applied when creating new instances of applications, workflows, or agents. Requires appropriate permissions.
// @Param   id      query    string            true    "Template ID in format 'owner/name', e.g., 'admin/template-workflow-basic'"
// @Param   body    body     object.Template   true    "Template object with updated fields including name, displayName, type, configuration, parameters, etc."
// @Success 200 {object} controllers.Response "Successfully updated template, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid template data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update template"
// @Failure 404 {object} controllers.Response "Not found: Template does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update template"
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
// @Description Create a new template with reusable configuration for applications, workflows, agents, or other resources. Templates allow quick creation of preconfigured instances with consistent settings. Requires appropriate permissions.
// @Param   body    body    object.Template    true    "Template object with required fields: owner, name, type, and optional fields: displayName, configuration, parameters, description, tags, etc."
// @Success 200 {object} controllers.Response "Successfully created template, returns success status and template ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid template data, missing required fields, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create template"
// @Failure 409 {object} controllers.Response "Conflict: Template with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create template"
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
// @Description Delete an existing template. This removes the template configuration but does not affect instances created from it. Requires appropriate permissions.
// @Param   body    body    object.Template    true    "Template object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted template, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid template data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete template"
// @Failure 404 {object} controllers.Response "Not found: Template does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete template"
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
