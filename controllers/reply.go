// Copyright 2020 The casbin Authors. All Rights Reserved.
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
	"strconv"

	"github.com/casbin/casbin-forum/object"
)

func (c *APIController) GetReplies() {
	topicId := c.Input().Get("topicId")

	c.Data["json"] = object.GetReplies(topicId)
	c.ServeJSON()
}

func (c *APIController) GetReply() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetReply(id)
	c.ServeJSON()
}

func (c *APIController) UpdateReply() {
	id := c.Input().Get("id")

	var reply object.Reply
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &reply)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateReply(id, &reply)
	c.ServeJSON()
}

func (c *APIController) AddReply() {
	var reply object.Reply
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &reply)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddReply(&reply)
	c.ServeJSON()
}

func (c *APIController) DeleteReply() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteReply(id)
	c.ServeJSON()
}

func (c *APIController) GetLatestReplies() {
	id := c.Input().Get("id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	var (
		limit, offset int
		err error
	)
	if len(limitStr) != 0 {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			panic(err)
		}
	}else {
		limit = 10
	}
	if len(pageStr) != 0 {
		page, err := strconv.Atoi(pageStr)
		if err != nil {
			panic(err)
		}
		offset = page * 10 - 10
	}

	c.Data["json"] = object.GetLatestReplies(id, limit, offset)
	c.ServeJSON()
}
    
