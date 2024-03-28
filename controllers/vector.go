// Copyright 2023 The casbin Authors. All Rights Reserved.
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
)

// GetGlobalVectors
// @Title Get Global Vectors
// @Tag Vector API
// @Description Retrieves global vectors from the database.
// @Success 200 {object} []Vector "An array of global vectors."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database."
// @router /global-vectors [get]
func (c *ApiController) GetGlobalVectors() {
	vectors, err := object.GetGlobalVectors()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectors)
}

// GetVectors
// @Title Get Vectors
// @Tag Vector API
// @Description Retrieves vectors belonging to a specific owner from the database.
// @Param owner query string true "The owner of the vectors to retrieve."
// @Success 200 {object} []Vector "An array of vectors belonging to the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /vectors [get]
func (c *ApiController) GetVectors() {
	owner := "admin"

	vectors, err := object.GetVectors(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectors)
}

// GetVector
// @Title Get Vector
// @Tag Vector API
// @Description Retrieves a vector by its ID from the database.
// @Param id query string true "The ID of the vector to retrieve."
// @Success 200 {object} Vector "The vector retrieved by its ID."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /vector [get]
func (c *ApiController) GetVector() {
	id := c.Input().Get("id")

	vector, err := object.GetVector(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vector)
}

// UpdateVector
// @Title Update Vector
// @Tag Vector API
// @Description Updates a vector in the database.
// @Param id query string true "The ID of the vector to update."
// @Param vector body object.Vector true "The updated vector data."
// @Success 200 {boolean} bool "True if the vector was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /vector [put]
func (c *ApiController) UpdateVector() {
	id := c.Input().Get("id")

	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVector(id, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddVector
// @Title Add Vector
// @Tag Vector API
// @Description Adds a new vector to the database.
// @Param vector body object.Vector true "The vector data to be added."
// @Success 200 {boolean} bool "True if the vector was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /vector [post]
func (c *ApiController) AddVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteVector
// @Title Delete Vector
// @Tag Vector API
// @Description Deletes a vector from the database.
// @Param vector body object.Vector true "The vector data to be deleted."
// @Success 200 {boolean} bool "True if the vector was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including issues with accessing the database or invalid parameters."
// @router /vector [delete]
func (c *ApiController) DeleteVector() {
	var vector object.Vector
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVector(&vector)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
