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

type Node struct {
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Name        string `xorm:"varchar(100)" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Desc        string `xorm:"varchar(500)" json:"desc"`
	Image       string `xorm:"varchar(200)" json:"image"`
	TabId       string `xorm:"varchar(100)" json:"tab"`
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

func GetNodeTopicNum(id string) int {
	topic := new(Topic)
	total, err := adapter.engine.Where("node_id = ?", id).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetNodeFromTab(tab string) []*Node {
	nodes := []*Node{}
	err := adapter.engine.Where("tab = ?", tab).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}
