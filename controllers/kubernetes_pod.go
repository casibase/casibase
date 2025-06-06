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

// GetPods
// @Title GetPods
// @Tag Pod API
// @Description get all pods
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Pod The Response object
// @router /get-pods [get]
func (c *ApiController) GetPods() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	_, err := object.SyncKubernetesPods(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if limit == "" || page == "" {
		pods, err := object.GetMaskedPods(object.GetPods(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(pods)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetPodCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		pods, err := object.GetMaskedPods(object.GetPaginationPods(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(pods, paginator.Nums())
	}
}

// GetPod
// @Title GetPod
// @Tag Pod API
// @Description get pod
// @Param   id     query    string  true        "The id ( owner/name ) of the pod"
// @Success 200 {object} object.Pod The Response object
// @router /get-pod [get]
func (c *ApiController) GetPod() {
	id := c.Input().Get("id")

	owner, _ := util.GetOwnerAndNameFromId(id)
	_, err := object.SyncKubernetesPods(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	pod, err := object.GetMaskedPod(object.GetPod(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(pod)
}

// UpdatePod
// @Title UpdatePod
// @Tag Pod API
// @Description update pod
// @Param   id     query    string  true        "The id ( owner/name ) of the pod"
// @Param   body    body   object.Pod  true        "The details of the pod"
// @Success 200 {object} controllers.Response The Response object
// @router /update-pod [post]
func (c *ApiController) UpdatePod() {
	id := c.Input().Get("id")

	var pod object.Pod
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &pod)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.UpdatePod(id, &pod))
}

// AddPod
// @Title AddPod
// @Tag Pod API
// @Description add a pod
// @Param   body    body   object.Pod  true        "The details of the pod"
// @Success 200 {object} controllers.Response The Response object
// @router /add-pod [post]
func (c *ApiController) AddPod() {
	var pod object.Pod
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &pod)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.AddPod(&pod))
}

// DeletePod
// @Title DeletePod
// @Tag Pod API
// @Description delete a pod
// @Param   body    body   object.Pod  true        "The details of the pod"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-pod [post]
func (c *ApiController) DeletePod() {
	var pod object.Pod
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &pod)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.DeletePod(&pod))
}
