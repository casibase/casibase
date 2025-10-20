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

// GetHospitals
// @Title GetHospitals
// @Tag Hospital API
// @Description get all hospitals
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Hospital The Response object
// @router /get-hospitals [get]
func (c *ApiController) GetHospitals() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		hospitals, err := object.GetMaskedHospitals(object.GetHospitals(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(hospitals)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetHospitalCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		hospitals, err := object.GetMaskedHospitals(object.GetPaginationHospitals(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(hospitals, paginator.Nums())
	}
}

// GetHospital
// @Title GetHospital
// @Tag Hospital API
// @Description get hospital
// @Param   id     query    string  true        "The id ( owner/name ) of the hospital"
// @Success 200 {object} object.Hospital The Response object
// @router /get-hospital [get]
func (c *ApiController) GetHospital() {
	id := c.Input().Get("id")

	hospital, err := object.GetMaskedHospital(object.GetHospital(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(hospital)
}

// UpdateHospital
// @Title UpdateHospital
// @Tag Hospital API
// @Description update hospital
// @Param   id     query    string  true        "The id ( owner/name ) of the hospital"
// @Param   body    body   object.Hospital  true        "The details of the hospital"
// @Success 200 {object} controllers.Response The Response object
// @router /update-hospital [post]
func (c *ApiController) UpdateHospital() {
	id := c.Input().Get("id")

	var hospital object.Hospital
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &hospital)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateHospital(id, &hospital))
	c.ServeJSON()
}

// AddHospital
// @Title AddHospital
// @Tag Hospital API
// @Description add a hospital
// @Param   body    body   object.Hospital  true        "The details of the hospital"
// @Success 200 {object} controllers.Response The Response object
// @router /add-hospital [post]
func (c *ApiController) AddHospital() {
	var hospital object.Hospital
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &hospital)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddHospital(&hospital))
	c.ServeJSON()
}

// DeleteHospital
// @Title DeleteHospital
// @Tag Hospital API
// @Description delete a hospital
// @Param   body    body   object.Hospital  true        "The details of the hospital"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-hospital [post]
func (c *ApiController) DeleteHospital() {
	var hospital object.Hospital
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &hospital)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeleteHospital(&hospital))
	c.ServeJSON()
}
