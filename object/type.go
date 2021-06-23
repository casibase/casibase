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

type LatestReply struct {
	TopicId      int    `xorm:"id" json:"topicId"`
	NodeId       string `json:"nodeId"`
	NodeName     string `json:"nodeName"`
	Author       string `json:"author"`
	ReplyContent string `xorm:"content" json:"replyContent"`
	TopicTitle   string `xorm:"title" json:"topicTitle"`
	ReplyTime    string `xorm:"created_time" json:"replyTime"`
}

type TopicWithAvatar struct {
	Topic         `xorm:"extends"`
	Avatar        string `json:"avatar"`
	ThanksStatus  bool   `json:"thanksStatus"`
	Editable      bool   `json:"editable"`
	NodeModerator bool   `json:"nodeModerator"`
}

type NodeTopic struct {
	Topic         `xorm:"extends"`
	Avatar        string `json:"avatar"`
	ThanksStatus  bool   `json:"thanksStatus"`
	Editable      bool   `json:"editable"`
	NodeModerator bool   `json:"nodeModerator"`
	ContentLength int    `json:"contentLength"`
}

type ReplyWithAvatar struct {
	Reply             `xorm:"extends"`
	Avatar            string `json:"avatar"`
	ThanksStatus      bool   `json:"thanksStatus"`
	Deletable         bool   `json:"deletable"`
	Editable          bool   `json:"editable"`
	ConsumptionAmount int    `xorm:"amount" json:"amount"`
}

type NodeFavoritesRes struct {
	NodeInfo *Node `json:"nodeInfo"`
	TopicNum int   `json:"topicNum"`
}

type CommunityHealth struct {
	Member int `json:"member"`
	Topic  int `json:"topic"`
	Reply  int `json:"reply"`
}

type NodeRelation struct {
	ParentNode  *Node   `json:"parentNode"`
	RelatedNode []*Node `json:"relatedNode"`
	ChildNode   []*Node `json:"childNode"`
}

type NotificationResponse struct {
	*Notification `xorm:"extends"`
	Title         string `json:"title"`
	Content       string `json:"content"`
	Avatar        string `json:"avatar"`
}

type NodeNavigationResponse struct {
	*Tab
	Nodes []*Node `json:"nodes"`
}

type PlaneWithNodes struct {
	*Plane
	Nodes []*Node `json:"nodes"`
}

type BalanceResponse struct {
	Amount          int    `json:"amount"`
	Title           string `json:"title"`
	Length          int    `json:"length"`
	Balance         int    `json:"balance"`
	ObjectId        int    `json:"objectId"`
	ReceiverId      string `json:"receiverId"`
	ConsumerId      string `json:"consumerId"`
	CreatedTime     string `json:"createdTime"`
	ConsumptionType int    `json:"consumptionType"`
}

type AdminTabInfo struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Sorter      int    `json:"sorter"`
	CreatedTime string `json:"createdTime"`
	DefaultNode string `json:"defaultNode"`
	HomePage    bool   `json:"homePage"`
	NodesNum    int    `json:"nodesNum"`
	TopicsNum   int    `json:"topicsNum"`
}

type AdminMemberInfo struct {
	Member
	FileQuota     int    `json:"fileQuota"`
	FileUploadNum int    `json:"fileUploadNum"`
	Status        int    `json:"status"`
	TopicNum      int    `json:"topicNum"`
	ReplyNum      int    `json:"replyNum"`
	LatestLogin   string `json:"latestLogin"`
	Score         int    `json:"score"`
}

type AdminPlaneInfo struct {
	Plane
	Sorter   int     `json:"sorter"`
	Visible  bool    `json:"visible"`
	NodesNum int     `json:"nodesNum"`
	Nodes    []*Node `json:"nodes"`
}

type AdminTopicInfo struct {
	Topic
	Deleted bool `json:"deleted"`
}
