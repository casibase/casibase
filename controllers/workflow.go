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

// GetGlobalWorkflows
// @Title GetGlobalWorkflows
// @Tag Workflow API
// @Description get global workflows
// @Success 200 {array} object.Workflow The Response object
// @router /get-global-workflows [get]
func (c *ApiController) GetGlobalWorkflows() {
	workflows, err := object.GetGlobalWorkflows()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedWorkflows(workflows, true))
}

// GetWorkflows
// @Title GetWorkflows
// @Tag Workflow API
// @Description get workflows
// @Param owner query string true "The owner of workflow"
// @Success 200 {array} object.Workflow The Response object
// @router /get-workflows [get]
func (c *ApiController) GetWorkflows() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		workflows, err := object.GetWorkflows(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(object.GetMaskedWorkflows(workflows, true))
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetWorkflowCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		workflows, err := object.GetPaginationWorkflows(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(workflows, paginator.Nums())
	}
}

// GetWorkflow
// @Title GetWorkflow
// @Tag Workflow API
// @Description get workflow
// @Param id query string true "The id (owner/name) of workflow"
// @Success 200 {object} object.Workflow The Response object
// @router /get-workflow [get]
func (c *ApiController) GetWorkflow() {
	id := c.Input().Get("id")

	workflow, err := object.GetWorkflow(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.GetMaskedWorkflow(workflow, true))
}

// UpdateWorkflow
// @Title UpdateWorkflow
// @Tag Workflow API
// @Description update workflow
// @Param id query string true "The id (owner/name) of the workflow"
// @Param body body object.Workflow true "The details of the workflow"
// @Success 200 {object} controllers.Response The Response object
// @router /update-workflow [post]
func (c *ApiController) UpdateWorkflow() {
	id := c.Input().Get("id")

	var workflow object.Workflow
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateWorkflow(id, &workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddWorkflow
// @Title AddWorkflow
// @Tag Workflow API
// @Description add workflow
// @Param body body object.Workflow true "The details of the workflow"
// @Success 200 {object} controllers.Response The Response object
// @router /add-workflow [post]
func (c *ApiController) AddWorkflow() {
	var workflow object.Workflow
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddWorkflow(&workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteWorkflow
// @Title DeleteWorkflow
// @Tag Workflow API
// @Description delete workflow
// @Param body body object.Workflow true "The details of the workflow"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-workflow [post]
func (c *ApiController) DeleteWorkflow() {
	var workflow object.Workflow
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteWorkflow(&workflow)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
