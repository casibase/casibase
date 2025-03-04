// Copyright 2024 The Casibase Authors.. All Rights Reserved.
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

// CommitRecord
// @Title CommitRecord
// @Tag Record API
// @Description commit a record
// @Param   body    body   object.Record  true        "The details of the record"
// @Success 200 {object} controllers.Response The Response object
// @router /commit-record [post]
func (c *ApiController) CommitRecord() {
	var record object.Record
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &record)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.CommitRecord(&record))
	c.ServeJSON()
}

// QueryRecord
// @Title QueryRecord
// @Tag Record API
// @Description query record
// @Param   id     query    string  true        "The id ( owner/name ) of the record"
// @Success 200 {object} object.Record The Response object
// @router /query-record [get]
func (c *ApiController) QueryRecord() {
	id := c.Input().Get("id")

	res, err := object.QueryRecord(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(res)
}
