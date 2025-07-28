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
	"fmt"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

type ApplicationDeploymentRequest struct {
	Owner       string `json:"owner"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Template    string `json:"template"`
	Parameters  string `json:"parameters"`
}

// GetApplications
// @Title GetApplications
// @Tag Application API
// @Description get applications
// @Param owner query string true "The owner of applications"
// @Success 200 {array} object.Application The Response object
// @router /get-applications [get]
func (c *ApiController) GetApplications() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		applications, err := object.GetApplications(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(applications)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetApplicationCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		applications, err := object.GetPaginationApplications(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(applications, paginator.Nums())
	}
}

// GetApplication
// @Title GetApplication
// @Tag Application API
// @Description get application
// @Param id query string true "The id of application"
// @Success 200 {object} object.Application The Response object
// @router /get-application [get]
func (c *ApiController) GetApplication() {
	id := c.Input().Get("id")

	res, err := object.GetApplication(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

// UpdateApplication
// @Title UpdateApplication
// @Tag Application API
// @Description update application
// @Param id query string true "The id (owner/name) of the application"
// @Param body body object.Application true "The details of the application"
// @Success 200 {object} controllers.Response The Response object
// @router /update-application [post]
func (c *ApiController) UpdateApplication() {
	id := c.Input().Get("id")

	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateApplication(id, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddApplication
// @Title AddApplication
// @Tag Application API
// @Description add application
// @Param body body object.Application true "The details of the application"
// @Success 200 {object} controllers.Response The Response object
// @router /add-application [post]
func (c *ApiController) AddApplication() {
	var req ApplicationDeploymentRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if req.Owner == "" || req.Name == "" || req.Template == "" {
		c.ResponseError("Missing required parameters")
		return
	}

	// Verify template exists
	template, err := object.GetTemplate(req.Owner, req.Template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if template == nil {
		c.ResponseError("The Template not found")
		return
	}

	// Create new application
	application := &object.Application{
		Owner:       req.Owner,
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Template:    req.Template,
		Parameters:  req.Parameters,
		Status:      "Not Deployed",
	}

	success, err := object.AddApplication(application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteApplication
// @Title DeleteApplication
// @Tag Application API
// @Description delete application
// @Param body body object.Application true "The details of the application"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-application [post]
func (c *ApiController) DeleteApplication() {
	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteApplication(&application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeployApplication
// @Title DeployApplication
// @Tag Application API
// @Description deploy application synchronously
// @Param body body ApplicationDeploymentRequest true "The deployment request details"
// @Success 200 {object} controllers.Response The Response object
// @router /deploy-application [post]
func (c *ApiController) DeployApplication() {
	id := c.Input().Get("id")

	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	originalApplication, err := object.GetApplication(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if originalApplication == nil {
		c.ResponseError(fmt.Sprintf("The application: %s is not found", id))
		return
	}

	success, err := object.UpdateApplication(id, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if !success {
		c.ResponseError("Failed to update application")
		return
	}

	// Deploy the application synchronously and wait for completion
	success, err = object.DeployApplicationSync(&application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// UndeployApplication
// @Title UndeployApplication
// @Tag Application API
// @Description undeploy application synchronously
// @Param body body ApplicationDeploymentRequest true "The deployment request details"
// @Success 200 {object} controllers.Response The Response object
// @router /undeploy-application [post]
func (c *ApiController) UndeployApplication() {
	id := c.Input().Get("id")

	application, err := object.GetApplication(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if application == nil {
		c.ResponseError(fmt.Sprintf("The application: %s is not found", id))
		return
	}

	owner, name := util.GetOwnerAndNameFromId(id)

	// Undeploy the application synchronously and wait for completion
	success, err := object.UndeployApplicationSync(owner, name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// GetApplicationStatus
// @Title GetApplicationStatus
// @Tag Application API
// @Description get application deployment status
// @Param id query string true "The id (owner/name) of the application"
// @Success 200 {object} object.DeploymentStatus The Response object
// @router /get-application-status [get]
func (c *ApiController) GetApplicationStatus() {
	id := c.Input().Get("id")
	owner, name := util.GetOwnerAndNameFromId(id)

	status, err := object.GetApplicationStatus(owner, name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(status)
}
