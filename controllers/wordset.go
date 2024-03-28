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
	"github.com/casibase/casibase/util"
)

// GetGlobalWordsets
// @Title Get Global Wordsets
// @Tag Wordset API
// @Description Retrieves all wordsets from the database.
// @Success 200 {array} []*Wordset "An array of wordset objects."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database."
// @router /get-global-wordsets [get]
func (c *ApiController) GetGlobalWordsets() {
	wordsets, err := object.GetGlobalWordsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

// GetWordsets
// @Title Get Wordsets
// @Tag Wordset API
// @Description Retrieves wordsets belonging to a specific owner from the database.
// @Param owner query string true "The owner of the wordsets to retrieve."
// @Success 200 {array} []*Wordset "An array of wordset objects owned by the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the owner is invalid."
// @router /get-wordsets [get]
func (c *ApiController) GetWordsets() {
	owner := c.Input().Get("owner")

	wordsets, err := object.GetWordsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

// GetWordset
// @Title Get Wordset
// @Tag Wordset API
// @Description Retrieves a specific wordset from the database based on its ID.
// @Param id query string true "The ID of the wordset to retrieve."
// @Success 200 {*Wordset} Wordset "The wordset object if found."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the ID is invalid."
// @router /get-wordset [get]
func (c *ApiController) GetWordset() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

// GetWordsetGraph
// @Title Get Wordset Graph
// @Tag Wordset API
// @Description Retrieves a graph representation of a specific wordset from the database based on its ID, with optional clustering and distance limit.
// @Param id query string true "The ID of the wordset to retrieve the graph for."
// @Param clusterNumber query int false "The number of clusters to generate (optional)."
// @Param distanceLimit query int false "The distance limit for clustering (optional)."
// @Success 200 {*} interface{} "The graph representation of the wordset."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the parameters are invalid."
// @router /get-wordset-graph [get]
func (c *ApiController) GetWordsetGraph() {
	id := c.Input().Get("id")
	clusterNumber := util.ParseInt(c.Input().Get("clusterNumber"))
	distanceLimit := util.ParseInt(c.Input().Get("distanceLimit"))

	g, err := object.GetWordsetGraph(id, clusterNumber, distanceLimit)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(g)
}

// GetWordsetMatch
// @Title Get Wordset Match
// @Tag Wordset API
// @Description Retrieves a matching wordset from the database based on the provided ID.
// @Param id query string true "The ID used to identify the wordset to retrieve the matching wordset for."
// @Success 200 {*Wordset} Wordset "The matching wordset object if found."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the provided ID is invalid."
// @router /get-wordset-match [get]
func (c *ApiController) GetWordsetMatch() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordsetMatch(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

// UpdateWordset
// @Title Update Wordset
// @Tag Wordset API
// @Description Updates a wordset in the database based on the provided ID and data.
// @Param id query string true "The ID used to identify the wordset to update."
// @Param wordset body Wordset true "The updated wordset data."
// @Success 200 {boolean} bool "True if the wordset was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body, accessing the database, or the provided ID is invalid."
// @router /update-wordset [put]
func (c *ApiController) UpdateWordset() {
	id := c.Input().Get("id")

	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateWordset(id, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

// AddWordset
// @Title Add Wordset
// @Tag Wordset API
// @Description Adds a new wordset to the database.
// @Param wordset body Wordset true "The wordset data to be added."
// @Success 200 {boolean} bool "True if the wordset was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
// @router /add-wordset [post]
func (c *ApiController) AddWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

// DeleteWordset
// @Title Delete Wordset
// @Tag Wordset API
// @Description Deletes a wordset from the database.
// @Param wordset body Wordset true "The wordset data to be deleted."
// @Success 200 {boolean} bool "True if the wordset was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
// @router /delete-wordset [delete]
func (c *ApiController) DeleteWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}
