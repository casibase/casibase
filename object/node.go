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

package object

import "sync"

type Node struct {
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Name        string `xorm:"varchar(100)" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Desc        string `xorm:"varchar(500)" json:"desc"`
	Image       string `xorm:"varchar(200)" json:"image"`
	TabId       string `xorm:"varchar(100)" json:"tab"`
	ParentNode  string `xorm:"varchar(200)" json:"parentNode"`
	PlaneId     string `xorm:"varchar(50)" json:"planeId"`
	Hot         int    `xorm:"int" json:"-"`
}

func GetNodes() []*Node {
	nodes := []*Node{}
	err := adapter.engine.Asc("created_time").Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetNode(id string) *Node {
	node := Node{Id: id}
	existed, err := adapter.engine.Get(&node)
	if err != nil {
		panic(err)
	}

	if existed {
		return &node
	} else {
		return nil
	}
}

func UpdateNode(id string, node *Node) bool {
	if GetNode(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).AllCols().Update(node)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddNode(node *Node) bool {
	affected, err := adapter.engine.Insert(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteNode(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Node{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetNodesNum() int {
	node := new(Node)
	total, err := adapter.engine.Count(node)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetNodeTopicNum(id string) int {
	topic := new(Topic)
	total, err := adapter.engine.Where("node_id = ?", id).And("deleted = ?", 0).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetNodeFromTab(tab string) []*Node {
	nodes := []*Node{}
	err := adapter.engine.Where("tab_id = ?", tab).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetNodeFromPlane(plane string) []*Node {
	nodes := []*Node{}
	err := adapter.engine.Where("plane_id = ?", plane).Cols("id, name").Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetNodeRelation(id string) *NodeRelation {
	node := new(Node)
	parentNode := new(Node)
	relatedNode := []*Node{}
	childNode := []*Node{}

	_, err := adapter.engine.Id(id).Cols("parent_node").Get(node)
	if err != nil {
		panic(err)
	}

	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		_, err = adapter.engine.Id(node.ParentNode).Get(parentNode)
		if err != nil {
			panic(err)
		}
	}()
	go func() {
		defer wg.Done()
		err = adapter.engine.Table("node").Where("parent_node = ?", node.ParentNode).And("id != ?", node.ParentNode).Find(&relatedNode)
		if err != nil {
			panic(err)
		}
	}()
	go func() {
		defer wg.Done()
		err = adapter.engine.Table("node").Where("parent_node = ?", id).And("id != ?", node.ParentNode).Find(&childNode)
		if err != nil {
			panic(err)
		}
	}()
	wg.Wait()

	res := &NodeRelation{
		ParentNode:  parentNode,
		RelatedNode: relatedNode,
		ChildNode:   childNode,
	}

	return res
}

func GetNodeNavigation() []*NodeNavigationResponse {
	tabs := GetAllTabs()
	//res := make([]*NodeNavigationResponse, len(notifications))
	res := []*NodeNavigationResponse{}
	for _, v := range tabs {
		temp := NodeNavigationResponse{
			Tab:   v,
			Nodes: GetNodeFromTab(v.Id),
		}
		res = append(res, &temp)
	}
	return res
}

func GetLatestNode(limit int) []*Node {
	nodes := []*Node{}
	err := adapter.engine.Asc("created_time").Limit(limit).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetHotNode(limit int) []*Node {
	nodes := []*Node{}
	err := adapter.engine.Desc("hot").Limit(limit).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func UpdateNodeHotInfo(nodeId string, hot int) bool {
	node := new(Node)

	node.Hot = hot
	affected, err := adapter.engine.Id(nodeId).Cols("hot").Update(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}
