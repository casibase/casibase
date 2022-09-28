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

import (
	"sync"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Node struct {
	Id                 string   `xorm:"varchar(100) notnull pk" json:"id"`
	Name               string   `xorm:"varchar(100)" json:"name"`
	CreatedTime        string   `xorm:"varchar(40)" json:"createdTime"`
	Desc               string   `xorm:"mediumtext" json:"desc"`
	Extra              string   `xorm:"mediumtext" json:"extra"`
	Image              string   `xorm:"varchar(200)" json:"image"`
	BackgroundImage    string   `xorm:"varchar(200)" json:"backgroundImage"`
	HeaderImage        string   `xorm:"varchar(200)" json:"headerImage"`
	BackgroundColor    string   `xorm:"varchar(20)" json:"backgroundColor"`
	BackgroundRepeat   string   `xorm:"varchar(20)" json:"backgroundRepeat"`
	TabId              string   `xorm:"varchar(100)" json:"tab"`
	ParentNode         string   `xorm:"varchar(200)" json:"parentNode"`
	PlaneId            string   `xorm:"varchar(50)" json:"planeId"`
	Sorter             int      `json:"sorter"`
	Ranking            int      `json:"ranking"`
	Hot                int      `json:"hot"`
	Moderators         []string `xorm:"varchar(200)" json:"moderators"`
	MailingList        string   `xorm:"varchar(100)" json:"mailingList"`
	GoogleGroupCookie  string   `xorm:"varchar(1500)" json:"googleGroupCookie"`
	GitterApiToken     string   `xorm:"varchar(200)" json:"gitterApiToken"`
	GitterRoomURL      string   `xorm:"varchar(200)" json:"gitterRoomUrl"`
	GitterSyncFromTime string   `xorm:"varchar(40)" json:"gitterSyncFromTime"`
	IsHidden           bool     `xorm:"bool" json:"isHidden"`
}

func GetNodes() []*Node {
	nodes := []*Node{}
	err := adapter.Engine.Desc("sorter").Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetNode(id string) *Node {
	if id == "" {
		return nil
	}
	node := Node{Id: id}
	existed, err := adapter.Engine.Get(&node)
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

	_, err := adapter.Engine.Id(id).AllCols().Update(node)
	if err != nil {
		panic(err)
	}

	isHidden := "0"
	if node.IsHidden {
		isHidden = "1"
	}

	_, err = adapter.Engine.Query("update topic set is_hidden = ? where node_id = ?", isHidden, node.Id)
	if err != nil {
		panic(err)
	}

	// return affected != 0
	return true
}

func AddNode(node *Node) bool {
	affected, err := adapter.Engine.Insert(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddNodes(nodes []*Node) bool {
	affected, err := adapter.Engine.Insert(nodes)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteNode(id string) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Node{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetNodesNum() int {
	node := new(Node)
	total, err := adapter.Engine.Count(node)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetNodeTopicNum(id string) int {
	topic := new(Topic)
	total, err := adapter.Engine.Where("node_id = ?", id).And("deleted = ?", 0).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetNodeFromTab(tab string) []*Node {
	nodes := []*Node{}
	err := adapter.Engine.Where("tab_id = ?", tab).Desc("sorter").Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetNodeFromPlane(plane string) []*Node {
	nodes := []*Node{}
	err := adapter.Engine.Where("plane_id = ?", plane).Cols("id, name").Desc("sorter").Find(&nodes)
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

	_, err := adapter.Engine.Id(id).Cols("parent_node").Get(node)
	if err != nil {
		panic(err)
	}

	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		_, err = adapter.Engine.Id(node.ParentNode).Get(parentNode)
		if err != nil {
			panic(err)
		}
	}()
	go func() {
		defer wg.Done()
		err = adapter.Engine.Table("node").Where("parent_node = ?", node.ParentNode).And("id != ?", node.ParentNode).Find(&relatedNode)
		if err != nil {
			panic(err)
		}
	}()
	go func() {
		defer wg.Done()
		err = adapter.Engine.Table("node").Where("parent_node = ?", id).And("id != ?", node.ParentNode).Find(&childNode)
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
	nodes := GetNodes()

	nodesMap := map[string][]*Node{}
	for _, node := range nodes {
		if _, ok := nodesMap[node.TabId]; !ok {
			nodesMap[node.TabId] = []*Node{}
		}
		nodesMap[node.TabId] = append(nodesMap[node.TabId], node)
	}

	res := []*NodeNavigationResponse{}
	for _, tab := range tabs {
		temp := NodeNavigationResponse{
			Tab:   tab,
			Nodes: nodesMap[tab.Id],
		}
		res = append(res, &temp)
	}
	return res
}

func GetLatestNode(limit int) []*Node {
	nodes := []*Node{}
	err := adapter.Engine.Asc("created_time").Limit(limit).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func GetHotNode(limit int) []*Node {
	nodes := []*Node{}
	err := adapter.Engine.Desc("hot").Limit(limit).Find(&nodes)
	if err != nil {
		panic(err)
	}

	return nodes
}

func UpdateNodeHotInfo(nodeId string, hot int) bool {
	node := new(Node)

	node.Hot = hot
	affected, err := adapter.Engine.Id(nodeId).Cols("hot").Update(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetNodeModerators(id string) []string {
	node := Node{Id: id}
	existed, err := adapter.Engine.Cols("moderators").Get(&node)
	if err != nil {
		panic(err)
	}

	if existed {
		return node.Moderators
	} else {
		return nil
	}
}

func CheckNodeModerator(user *casdoorsdk.User, nodeId string) bool {
	node := Node{Id: nodeId}
	existed, err := adapter.Engine.Cols("moderators").Get(&node)
	if err != nil {
		panic(err)
	}

	if !existed || len(node.Moderators) == 0 {
		return false
	}
	for _, v := range node.Moderators {
		if v == GetUserName(user) {
			return true
		}
	}
	return false
}

func AddNodeModerators(memberId, nodeId string) bool {
	node := new(Node)

	moderators := GetNodeModerators(nodeId)
	for _, v := range moderators {
		if v == memberId {
			return false
		}
	}
	node.Moderators = append(moderators, memberId)
	affected, err := adapter.Engine.Id(nodeId).Cols("moderators").Update(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteNodeModerators(memberId, nodeId string) bool {
	node := new(Node)

	moderators := GetNodeModerators(nodeId)
	for i, v := range moderators {
		if v == memberId {
			moderators = append(moderators[:i], moderators[i+1:]...)
			break
		}
	}
	node.Moderators = moderators
	affected, err := adapter.Engine.Id(nodeId).Cols("moderators").Update(node)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func (n Node) GetAllTopicTitlesOfNode() []string {
	var topics []Topic
	var ret []string
	err := adapter.Engine.Where("node_id = ? and deleted = 0", n.Id).Find(&topics)
	if err != nil {
		panic(err)
	}
	for _, topic := range topics {
		ret = append(ret, topic.Title)
	}
	return ret
}

func (n Node) GetAllTopicsByNode() []Topic {
	var topics []Topic
	err := adapter.Engine.Where("node_id = ? and deleted = 0", n.Id).Desc("created_time").Find(&topics)
	if err != nil {
		panic(err)
	}
	return topics
}
