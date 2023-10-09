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

func (c *ApiController) GetGlobalWordsets() {
	wordsets, err := object.GetGlobalWordsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

func (c *ApiController) GetWordsets() {
	owner := c.Input().Get("owner")

	wordsets, err := object.GetWordsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

func (c *ApiController) GetWordset() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

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

func (c *ApiController) GetWordsetMatch() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordsetMatch(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

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
