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

// GetPatients
// @Title GetPatients
// @Tag Patient API
// @Description get all patients
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Patient The Response object
// @router /get-patients [get]
func (c *ApiController) GetPatients() {
	user := c.GetSessionUser()
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		patients, err := object.GetMaskedPatients(object.GetPatients(owner))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter patients by user role
		patients = object.FilterPatientsByUser(user, patients)

		c.ResponseOk(patients)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetPatientCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		patients, err := object.GetMaskedPatients(object.GetPaginationPatients(owner, paginator.Offset(), limit, field, value, sortField, sortOrder))
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		// Filter patients by user role
		patients = object.FilterPatientsByUser(user, patients)

		c.ResponseOk(patients, paginator.Nums())
	}
}

// GetPatient
// @Title GetPatient
// @Tag Patient API
// @Description get patient
// @Param   id     query    string  true        "The id ( owner/name ) of the patient"
// @Success 200 {object} object.Patient The Response object
// @router /get-patient [get]
func (c *ApiController) GetPatient() {
	id := c.Input().Get("id")

	patient, err := object.GetMaskedPatient(object.GetPatient(id))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(patient)
}

// UpdatePatient
// @Title UpdatePatient
// @Tag Patient API
// @Description update patient
// @Param   id     query    string  true        "The id ( owner/name ) of the patient"
// @Param   body    body   object.Patient  true        "The details of the patient"
// @Success 200 {object} controllers.Response The Response object
// @router /update-patient [post]
func (c *ApiController) UpdatePatient() {
	user := c.GetSessionUser()
	id := c.Input().Get("id")

	var patient object.Patient
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &patient)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Check if user has permission to update
	if !object.CanEditPatient(user, &patient) {
		c.ResponseError("Unauthorized operation")
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdatePatient(id, &patient))
	c.ServeJSON()
}

// AddPatient
// @Title AddPatient
// @Tag Patient API
// @Description add a patient
// @Param   body    body   object.Patient  true        "The details of the patient"
// @Success 200 {object} controllers.Response The Response object
// @router /add-patient [post]
func (c *ApiController) AddPatient() {
	var patient object.Patient
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &patient)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Initialize Owners if not set
	if patient.Owners == nil {
		patient.Owners = []string{}
	}

	c.Data["json"] = wrapActionResponse(object.AddPatient(&patient))
	c.ServeJSON()
}

// DeletePatient
// @Title DeletePatient
// @Tag Patient API
// @Description delete a patient
// @Param   body    body   object.Patient  true        "The details of the patient"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-patient [post]
func (c *ApiController) DeletePatient() {
	user := c.GetSessionUser()

	var patient object.Patient
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &patient)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Check if user has permission to delete
	if !object.CanEditPatient(user, &patient) {
		c.ResponseError("Unauthorized operation")
		return
	}

	c.Data["json"] = wrapActionResponse(object.DeletePatient(&patient))
	c.ServeJSON()
}
