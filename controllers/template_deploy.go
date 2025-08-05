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
	"github.com/casibase/casibase/object"
)

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
