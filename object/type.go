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
	TopicId      int    `json:"topicId"`
	NodeId       string `json:"nodeId"`
	NodeName     string `json:"nodeName"`
	Author       string `json:"author"`
	ReplyContent string `json:"replyContent"`
	TopicTitle   string `json:"topicTitle"`
	ReplyTime    string `json:"replyTime"`
}

type TopicWithAvatar struct {
	Topic
	Avatar        string `json:"avatar"`
	ThanksStatus  bool   `json:"thanksStatus"`
	Editable      bool   `json:"editable"`
	NodeModerator bool   `json:"nodeModerator"`
}

type NodeTopic struct {
	Topic
	Avatar        string `json:"avatar"`
	ThanksStatus  bool   `json:"thanksStatus"`
	Editable      bool   `json:"editable"`
	NodeModerator bool   `json:"nodeModerator"`
	ContentLength int    `json:"contentLength"`
}

type ReplyWithAvatar struct {
	Reply
	Avatar       string `json:"avatar"`
	ThanksStatus bool   `json:"thanksStatus"`
	Deletable    bool   `json:"deletable"`
	Editable     bool   `json:"editable"`
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
	*Notification
	Title   string `json:"title"`
	Content string `json:"content"`
	Avatar  string `json:"avatar"`
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
