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

func (c *ApiController) GetK8sStatus() {
	status, err := object.GetK8sStatus()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(status)
}
