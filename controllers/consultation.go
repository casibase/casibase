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

// GetConsultations
// @Title GetConsultations
// @Tag Consultation API
// @Description get all consultations
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Consultation The Response object
// @router /get-consultations [get]
func (c *ApiController) GetConsultations() {
	user := c.GetSessionUser()
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		consultations, err := object.GetMaskedConsultations(object.GetConsultations(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter consultations by user role
		consultations = object.FilterConsultationsByUser(user, consultations)

		c.ResponseOk(consultations)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetConsultationCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		consultations, err := object.GetMaskedConsultations(object.GetPaginationConsultations(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter consultations by user role
		consultations = object.FilterConsultationsByUser(user, consultations)

		c.ResponseOk(consultations, paginator.Nums())
	}
}

// GetConsultation
// @Title GetConsultation
// @Tag Consultation API
// @Description get consultation
// @Param   id     query    string  true        "The id ( owner/name ) of the consultation"
// @Success 200 {object} object.Consultation The Response object
// @router /get-consultation [get]
func (c *ApiController) GetConsultation() {
	id := c.Input().Get("id")

	consultation, err := object.GetMaskedConsultation(object.GetConsultation(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(consultation)
}

// UpdateConsultation
// @Title UpdateConsultation
// @Tag Consultation API
// @Description update consultation
// @Param   id     query    string  true        "The id ( owner/name ) of the consultation"
// @Param   body    body   object.Consultation  true        "The details of the consultation"
// @Success 200 {object} controllers.Response The Response object
// @router /update-consultation [post]
func (c *ApiController) UpdateConsultation() {
	id := c.Input().Get("id")

	var consultation object.Consultation
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &consultation)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateConsultation(id, &consultation))
	c.ServeJSON()
}

// AddConsultation
// @Title AddConsultation
// @Tag Consultation API
// @Description add a consultation
// @Param   body    body   object.Consultation  true        "The details of the consultation"
// @Success 200 {object} controllers.Response The Response object
// @router /add-consultation [post]
func (c *ApiController) AddConsultation() {
	var consultation object.Consultation
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &consultation)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddConsultation(&consultation))
	c.ServeJSON()
}

// DeleteConsultation
// @Title DeleteConsultation
// @Tag Consultation API
// @Description delete a consultation
// @Param   body    body   object.Consultation  true        "The details of the consultation"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-consultation [post]
func (c *ApiController) DeleteConsultation() {
	var consultation object.Consultation
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &consultation)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteConsultation(&consultation))
	c.ServeJSON()
}
