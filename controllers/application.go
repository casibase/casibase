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

// GetApplications
// @Title GetApplications
// @Tag Application API
// @Description Get applications for a specific owner with optional pagination, filtering and sorting. Applications represent deployable services, containers, or workflows managed by Casibase. When pageSize and p parameters are provided, returns paginated results. Supports filtering and sorting by various fields.
// @Param   owner        query    string  true    "Owner of the applications, typically 'admin', e.g., 'admin'"
// @Param   pageSize     query    string  false   "Number of items per page for pagination, e.g., '10'"
// @Param   p            query    string  false   "Page number for pagination, e.g., '1'"
// @Param   field        query    string  false   "Field name for filtering, e.g., 'status'"
// @Param   value        query    string  false   "Value for field filtering, e.g., 'running'"
// @Param   sortField    query    string  false   "Field name for sorting, e.g., 'createdTime'"
// @Param   sortOrder    query    string  false   "Sort order: 'ascend' or 'descend'"
// @Success 200 {array} object.Application "Successfully returns array of application objects with deployment details, optional pagination info"
// @Failure 400 {object} controllers.Response "Bad request: Invalid owner parameter"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve applications"
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
		object.AddDetails(applications, c.GetAcceptLanguage())
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

		object.AddDetails(applications, c.GetAcceptLanguage())
		c.ResponseOk(applications, paginator.Nums())
	}
}

// GetApplication
// @Title GetApplication
// @Tag Application API
// @Description Get detailed information of a specific application including deployment status, configuration, template, namespace, resource usage, and runtime details. Applications can be containers, services, or workflows managed by Casibase.
// @Param   id    query    string  true    "Application ID in format 'owner/name', e.g., 'admin/app-web-service'"
// @Success 200 {object} object.Application "Successfully returns application object with all deployment and configuration details"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application ID format"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to access this application"
// @Failure 404 {object} controllers.Response "Not found: Application does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve application"
// @router /get-application [get]
func (c *ApiController) GetApplication() {
	id := c.Input().Get("id")

	res, err := object.GetApplication(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res != nil {
		object.AddDetails([]*object.Application{res}, c.GetAcceptLanguage())
	}

	c.ResponseOk(res)
}

// UpdateApplication
// @Title UpdateApplication
// @Tag Application API
// @Description Update an existing application's configuration including template, namespace, environment variables, resource limits, and deployment settings. Does not trigger redeployment - use deploy endpoint for that. Requires appropriate permissions.
// @Param   id      query    string               true    "Application ID in format 'owner/name', e.g., 'admin/app-web-service'"
// @Param   body    body     object.Application   true    "Application object with updated fields including name, displayName, template, namespace, configuration, environment, resources, etc."
// @Success 200 {object} controllers.Response "Successfully updated application, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to update application"
// @Failure 404 {object} controllers.Response "Not found: Application does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update application"
// @router /update-application [post]
func (c *ApiController) UpdateApplication() {
	id := c.Input().Get("id")

	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateApplication(id, &application, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddApplication
// @Title AddApplication
// @Tag Application API
// @Description Create a new application from a template. Applications represent deployable services, containers, or workflows. Template must exist before creating application. After creation, use deploy endpoint to start the application. Requires appropriate permissions.
// @Param   body    body    object.Application    true    "Application object with required fields: owner, name, template, and optional fields: displayName, namespace, configuration, environment, resources, etc."
// @Success 200 {object} controllers.Response "Successfully created application, returns success status and application ID"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application data, missing template parameter, template not found, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to create application"
// @Failure 404 {object} controllers.Response "Not found: Template does not exist"
// @Failure 409 {object} controllers.Response "Conflict: Application with same ID already exists"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to create application"
// @router /add-application [post]
func (c *ApiController) AddApplication() {
	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if application.Template == "" {
		c.ResponseError(c.T("application:Missing required parameters"))
		return
	}

	// Verify template exists
	template, err := object.GetTemplate(util.GetIdFromOwnerAndName(application.Owner, application.Template))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if template == nil {
		c.ResponseError(c.T("application:The Template not found"))
		return
	}

	success, err := object.AddApplication(&application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteApplication
// @Title DeleteApplication
// @Tag Application API
// @Description Delete an existing application and clean up associated resources. If application is deployed, it will be undeployed first. This operation removes containers, services, and configuration. Requires appropriate permissions.
// @Param   body    body    object.Application    true    "Application object to delete, must include at least owner and name fields"
// @Success 200 {object} controllers.Response "Successfully deleted application and cleaned up resources, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application data or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to delete application"
// @Failure 404 {object} controllers.Response "Not found: Application does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to delete application or undeploy resources"
// @router /delete-application [post]
func (c *ApiController) DeleteApplication() {
	var application object.Application
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &application)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteApplication(&application, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeployApplication
// @Title DeployApplication
// @Tag Application API
// @Description Deploy application synchronously and wait for completion. Updates application configuration first, then deploys to target environment (Docker, Kubernetes, etc.). This operation starts containers, services, and configures networking. Returns updated application with deployment status. Requires appropriate permissions.
// @Param   id      query    string               true    "Application ID in format 'owner/name', e.g., 'admin/app-web-service'"
// @Param   body    body     object.Application   true    "Application object with configuration for deployment including template, namespace, environment, resources, etc."
// @Success 200 {object} object.Application "Successfully deployed application, returns updated application object with deployment status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application data, application not found, or malformed JSON"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to deploy application"
// @Failure 404 {object} controllers.Response "Not found: Application or template does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to update or deploy application, deployment failed, or infrastructure error"
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

	success, err := object.UpdateApplication(id, &application, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if !success {
		c.ResponseError(c.T("application:Failed to update application"))
		return
	}

	// Deploy the application synchronously and wait for completion
	success, err = object.DeployApplicationSync(&application, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	updatedApplication, err := object.GetApplication(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(updatedApplication)
}

// UndeployApplication
// @Title UndeployApplication
// @Tag Application API
// @Description Undeploy application synchronously and wait for completion. Stops containers, removes services, and cleans up resources in the target environment (Docker, Kubernetes, etc.). Application configuration remains in database for future redeployment. Requires appropriate permissions.
// @Param   id    query    string  true    "Application ID in format 'owner/name', e.g., 'admin/app-web-service'"
// @Success 200 {object} controllers.Response "Successfully undeployed application and cleaned up resources, returns success status"
// @Failure 400 {object} controllers.Response "Bad request: Invalid application ID format or application not found"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 403 {object} controllers.Response "Forbidden: Insufficient permissions to undeploy application"
// @Failure 404 {object} controllers.Response "Not found: Application does not exist"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to undeploy application or clean up resources"
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

	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Undeploy the application synchronously and wait for completion
	success, err := object.UndeployApplicationSync(owner, name, application.Namespace, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
