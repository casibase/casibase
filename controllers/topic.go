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

	"github.com/astaxie/beego"

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

type NewTopicForm struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	NodeId string `json:"nodeId"`
}

func (c *APIController) GetTopics() {
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit, _ := beego.AppConfig.Int("defaultHomePageNum")

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopics(limit, offset)
	c.ServeJSON()
}

func (c *APIController) GetTopic() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetTopicWithAvatar(id)
	c.ServeJSON()
}

func (c *APIController) UpdateTopic() {
	id := c.Input().Get("id")

	var topic object.Topic
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &topic)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateTopic(id, &topic)
	c.ServeJSON()
}

func (c *APIController) AddTopic() {
	if c.RequireLogin() {
		return
	}

	var form NewTopicForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}
	title, body, nodeId := form.Title, form.Body, form.NodeId

	topic := object.Topic{
		Id:            util.IntToString(object.GetTopicId()),
		Author:        c.GetSessionUser(),
		NodeId:        nodeId,
		NodeName:      "",
		Title:         title,
		CreatedTime:   util.GetCurrentTime(),
		Tags:          nil,
		LastReplyUser: "",
		UpCount:       0,
		HitCount:      0,
		FavoriteCount: 0,
		Content:       body,
	}

	err = json.Unmarshal(c.Ctx.Input.RequestBody, &topic)
	if err != nil {
		panic(err)
	}

	c.wrapResponse(object.AddTopic(&topic))
}

func (c *APIController) DeleteTopic() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteTopic(id)
	c.ServeJSON()
}

func (c *APIController) GetTopicsNum() {
	c.Data["json"] = object.GetTopicCount()
	c.ServeJSON()
}

func (c *APIController) GetAllCreatedTopics() {
	author := c.Input().Get("id")
	tab := c.Input().Get("tab")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	var (
		limit, offset int
		err           error
	)
	if len(limitStr) != 0 {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			panic(err)
		}
	} else {
		limit = 10
	}
	if len(pageStr) != 0 {
		page, err := strconv.Atoi(pageStr)
		if err != nil {
			panic(err)
		}
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetAllCreatedTopics(author, tab, limit, offset)
	c.ServeJSON()
}

func (c *APIController) GetCreatedTopicsNum() {
	memberId := c.Input().Get("id")

	c.Data["json"] = object.GetCreatedTopicsNum(memberId)
	c.ServeJSON()
}

func (c *APIController) GetTopicsByNode() {
	nodeId := c.Input().Get("node-id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit, _ := beego.AppConfig.Int("nodePageTopicsNum")

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopicsWithNode(nodeId, limit, offset)
	c.ServeJSON()
}

func (c *APIController) AddTopicHitCount() {
	topicId := c.Input().Get("id")

	var resp Response
	res := object.AddTopicHitCount(topicId)
	if res {
		resp = Response{Status: "ok", Msg: "success"}
	} else {
		resp = Response{Status: "fail", Msg: "add topic hit count failed"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetTopicsByTab() {
	tabId := c.Input().Get("tab-id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit, _ := beego.AppConfig.Int("nodePageTopicsNum")

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetTopicsWithTab(tabId, limit, offset)
	c.ServeJSON()
}
