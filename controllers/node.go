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

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

func (c *APIController) GetNodes() {
	c.Data["json"] = object.GetNodes()
	c.ServeJSON()
}

func (c *APIController) GetNodesAdmin() {
	var res []adminNodeInfo
	nodes := object.GetNodes()
	for _, v := range nodes {
		node := adminNodeInfo{
			NodeInfo:     *v,
			TopicNum:     object.GetNodeTopicNum(v.Id),
			FavoritesNum: object.GetNodeFavoritesNum(v.Id),
		}
		res = append(res, node)
	}

	c.Data["json"] = res
	c.ServeJSON()
}

func (c *APIController) GetNode() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetNode(id)
	c.ServeJSON()
}

func (c *APIController) UpdateNode() {
	id := c.Input().Get("id")

	var resp Response
	var node object.Node

	if !object.CheckModIdentity(c.GetSessionUser()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}
	res := object.UpdateNode(id, &node)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) AddNode() {
	var node object.Node
	var resp Response

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}

	if node.Id == "" || node.Name == "" || node.ParentNode == "" || node.TabId == "" || node.PlaneId == "" {
		resp = Response{Status: "fail", Msg: "Some information is missing"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if object.HasNode(node.Id) {
		resp = Response{Status: "fail", Msg: "Node ID existed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	node.CreatedTime = util.GetCurrentTime()
	res := object.AddNode(&node)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) DeleteNode() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteNode(id)
	c.ServeJSON()
}

func (c *APIController) GetNodesNum() {
	var resp Response

	num := object.GetNodesNum()
	resp = Response{Status: "ok", Msg: "success", Data: num}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetNodeInfo() {
	id := c.Input().Get("id")

	var resp Response
	num := object.GetNodeTopicNum(id)
	favoriteNum := object.GetNodeFavoritesNum(id)
	resp = Response{Status: "ok", Msg: "success", Data: num, Data2: favoriteNum}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetNodeFromTab() {
	tab := c.Input().Get("tab")

	var resp Response
	nodes := object.GetNodeFromTab(tab)
	resp = Response{Status: "ok", Msg: "success", Data: nodes}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetNodeRelation() {
	id := c.Input().Get("id")

	var resp Response
	res := object.GetNodeRelation(id)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetLatestNode() {
	limitStr := c.Input().Get("limit")
	defaultLimit := object.LatestNodeNum

	var limit int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}

	var resp Response
	res := object.GetLatestNode(limit)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetHotNode() {
	limitStr := c.Input().Get("limit")
	defaultLimit := object.HotNodeNum

	var limit int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}

	var resp Response
	res := object.GetHotNode(limit)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) AddNodeBrowseCount() {
	nodeId := c.Input().Get("id")

	var resp Response
	hitRecord := object.BrowseRecord{
		MemberId:    c.GetSessionUser(),
		RecordType:  1,
		ObjectId:    nodeId,
		CreatedTime: util.GetCurrentTime(),
		Expired:     false,
	}
	res := object.AddBrowseRecordNum(&hitRecord)
	if res {
		resp = Response{Status: "ok", Msg: "success"}
	} else {
		resp = Response{Status: "fail", Msg: "add node hit count failed"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) AddNodeModerators() {
	var moderators addNodeModerator
	var resp Response

	memberId := c.GetSessionUser()
	if !object.CheckModIdentity(memberId) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &moderators)
	if err != nil {
		panic(err)
	}

	moderator := object.GetMember(moderators.MemberId)
	if moderator == nil {
		resp = Response{Status: "fail", Msg: "Member doesn't exist."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	res := object.AddNodeModerators(moderators.MemberId, moderators.NodeId)
	if res {
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "Moderator already exist."}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) DeleteNodeModerators() {
	var moderators deleteNodeModerator
	var resp Response

	memberId := c.GetSessionUser()
	if !object.CheckModIdentity(memberId) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &moderators)
	if err != nil {
		panic(err)
	}

	res := object.DeleteNodeModerators(moderators.MemberId, moderators.NodeId)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}
