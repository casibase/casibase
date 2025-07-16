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

	"github.com/casibase/casibase/conf"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

type DeploymentRequest struct {
	Owner     string `json:"owner"`
	Name      string `json:"name"`
	Manifests string `json:"manifests"`
}

func (c *ApiController) GetApplicationTemplates() {
	owner := c.Input().Get("owner")

	res, err := object.GetApplicationTemplates(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

func (c *ApiController) GetApplicationTemplate() {
	id := c.Input().Get("id")

	res, err := object.GetApplicationTemplate(util.GetOwnerAndNameFromId(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}

func (c *ApiController) UpdateApplicationTemplate() {
	id := c.Input().Get("id")

	var template object.ApplicationTemplate
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateApplicationTemplate(id, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddApplicationTemplate() {
	var template object.ApplicationTemplate
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddApplicationTemplate(&template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteApplicationTemplate() {
	var template object.ApplicationTemplate
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &template)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteApplicationTemplate(template.Owner, template.Name)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeployApplicationTemplate() {
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

func (c *ApiController) GetK8sConfig() {
	k8sConfig := conf.GetK8sConfig()

	safeConfig := map[string]interface{}{
		"enabled":           k8sConfig.Enabled,
		"inCluster":         k8sConfig.InCluster,
		"namespacePrefix":   k8sConfig.NamespacePrefix,
		"defaultNamespace":  k8sConfig.DefaultNamespace,
		"connectionTimeout": k8sConfig.ConnectionTimeout.Seconds(),
		"deploymentTimeout": k8sConfig.DeploymentTimeout.Seconds(),
		"connected":         object.IsK8sConnected(),
	}

	c.ResponseOk(safeConfig)
}

func (c *ApiController) TestK8sConnection() {
	status, err := object.TestK8sConnection()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(status)
}
