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

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

type DeploymentRequest struct {
	Owner     string `json:"owner"`
	Name      string `json:"name"`
	Manifests string `json:"manifests"`
}

// DeployTemplate
// @Title DeployTemplate
// @Tag Deployment API
// @Description deploy application template
// @Param body body DeploymentRequest true "The deployment request details"
// @Success 200 {object} controllers.Response The Response object
// @router /deploy-template [post]
func (c *ApiController) DeployTemplate() {
	var req DeploymentRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if req.Owner == "" || req.Name == "" || req.Manifests == "" {
		c.ResponseError("Missing required parameters")
		return
	}

	err = object.DeployApplicationTemplate(req.Owner, req.Name, req.Manifests)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(true)
}

// DeleteDeployment
// @Title DeleteDeployment
// @Tag Deployment API
// @Description delete deployment
// @Param body body DeploymentRequest true "The deployment request details"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-deployment [post]
func (c *ApiController) DeleteDeployment() {
	var req DeploymentRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if req.Owner == "" || req.Name == "" {
		c.ResponseError("Missing required parameters")
		return
	}

	err = object.DeleteDeployment(req.Owner, req.Name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(true)
}

// GetDeploymentStatus
// @Title GetDeploymentStatus
// @Tag Deployment API
// @Description get deployment status
// @Param id query string true "The id (owner/name) of the deployment"
// @Success 200 {object} object.DeploymentStatus The Response object
// @router /get-deployment-status [get]
func (c *ApiController) GetDeploymentStatus() {
	id := c.Input().Get("id")
	owner, name := util.GetOwnerAndNameFromId(id)

	status, err := object.GetDeploymentStatus(owner, name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(status)
}

// GetK8sStatus
// @Title GetK8sStatus
// @Tag Deployment API
// @Description get kubernetes cluster status
// @Success 200 {object} object.K8sStatus The Response object
// @router /get-k8s-status [get]
func (c *ApiController) GetK8sStatus() {
	status, err := object.GetK8sStatus()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(status)
}
