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

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

// @Title GetNodes
// @router /get-nodes [get]
// @Tag Node API
func (c *ApiController) GetNodes() {
	c.Data["json"] = object.GetNodes()
	c.ServeJSON()
}

// @Title GetNodesAdmin
// @router /get-nodes-admin [get]
// @Tag Node API
func (c *ApiController) GetNodesAdmin() {
	res := []adminNodeInfo{}
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

// @Title GetNode
// @router /get-node [get]
// @Tag Node API
func (c *ApiController) GetNode() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetNode(id)
	c.ServeJSON()
}

// @Title UpdateNode
// @router /update-node [post]
// @Tag Node API
func (c *ApiController) UpdateNode() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")

	var node object.Node
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}
	res := object.UpdateNode(id, &node)
	c.ResponseOk(res)
}

// @Title AddNode
// @router /add-node [post]
// @Tag Node API
func (c *ApiController) AddNode() {
	if c.RequireAdmin() {
		return
	}

	var node object.Node
	var resp Response

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &node)
	if err != nil {
		panic(err)
	}

	if node.Id == "" || node.Name == "" || node.TabId == "" || node.PlaneId == "" {
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
	c.ResponseOk(res)
}

// @Title DeleteNode
// @router /delete-node [post]
// @Tag Node API
func (c *ApiController) DeleteNode() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteNode(id)
	c.ServeJSON()
}

// @Title GetNodesNum
// @router /get-nodes-num [get]
// @Tag Node API
func (c *ApiController) GetNodesNum() {
	num := object.GetNodesNum()
	c.ResponseOk(num)
}

// @Title GetNodeInfo
// @router /get-node-info [get]
// @Tag Node API
func (c *ApiController) GetNodeInfo() {
	id := c.Input().Get("id")

	num := object.GetNodeTopicNum(id)
	favoriteNum := object.GetNodeFavoritesNum(id)
	c.ResponseOk(num, favoriteNum)
}

func (c *ApiController) GetNodeFromTab() {
	tab := c.Input().Get("tab")

	nodes := object.GetNodeFromTab(tab)
	c.ResponseOk(nodes)
}

// @Title GetNodeRelation
// @router /get-node-relation [get]
// @Tag Node API
func (c *ApiController) GetNodeRelation() {
	id := c.Input().Get("id")

	res := object.GetNodeRelation(id)
	c.ResponseOk(res)
}

// @Tag Node API
// @router /get-latest-node [get]
// @Title GetLatestNode
func (c *ApiController) GetLatestNode() {
	limitStr := c.Input().Get("limit")
	defaultLimit := object.LatestNodeNum

	var limit int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}

	res := object.GetLatestNode(limit)
	c.ResponseOk(res)
}

// @Title GetHotNod
// @Tag Node API
// @router /get-hot-node [get]
func (c *ApiController) GetHotNode() {
	limitStr := c.Input().Get("limit")
	defaultLimit := object.HotNodeNum

	var limit int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}

	res := object.GetHotNode(limit)
	c.ResponseOk(res)
}

// @Title AddNodeBrowseCount
// @Tag Node API
// @router /add-node-browse-record [post]
func (c *ApiController) AddNodeBrowseCount() {
	nodeId := c.Input().Get("id")

	var resp Response
	hitRecord := object.BrowseRecord{
		MemberId:    c.GetSessionUsername(),
		RecordType:  1,
		ObjectId:    nodeId,
		CreatedTime: util.GetCurrentTime(),
		Expired:     false,
	}
	res := object.AddBrowseRecordNum(&hitRecord)
	if res {
		c.ResponseOk()
	} else {
		resp = Response{Status: "fail", Msg: "add node hit count failed"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title AddNodeModerators
// @Tag Node API
// @router /add-node-moderators [post]
func (c *ApiController) AddNodeModerators() {
	if c.RequireAdmin() {
		return
	}

	var moderators addNodeModerator
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &moderators)
	if err != nil {
		panic(err)
	}

	moderator := object.GetUser(moderators.MemberId)
	if moderator == nil {
		c.ResponseError("Member doesn't exist.")
		return
	}

	res := object.AddNodeModerators(moderators.MemberId, moderators.NodeId)
	if res {
		c.ResponseOk(res)
	} else {
		c.ResponseError("Moderator already exist.")
	}
}

// @Title DeleteNodeModerators
// @Tag Node API
// @router /delete-node-moderators [post]
func (c *ApiController) DeleteNodeModerators() {
	if c.RequireAdmin() {
		return
	}

	var moderators deleteNodeModerator
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &moderators)
	if err != nil {
		panic(err)
	}

	res := object.DeleteNodeModerators(moderators.MemberId, moderators.NodeId)
	c.ResponseOk(res)
}
