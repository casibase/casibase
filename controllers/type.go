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

import "github.com/casbin/casnode/object"

type GetAccessTokenRespFromWeChat struct {
	AccessToken  string  `json:"access_token"`
	ExpiresIn    float64 `json:"expires_in"`
	RefreshToken string  `json:"refresh_token"`
	Openid       string  `json:"openid"`
	Scope        string  `json:"scope"`
}

type authResponse struct {
	IsAuthenticated bool   `json:"isAuthenticated"`
	IsSignedUp      bool   `json:"isSignedUp"`
	Email           string `json:"email"`
	Avatar          string `json:"avatar"`
	Addition        string `json:"addition"`
}

type newNotification struct {
	ObjectId         int    `json:"objectId"`
	NotificationType int    `json:"notificationType"`
	ReceiverId       string `json:"receiverId"`
}

type updateTopicNode struct {
	Id       int    `json:"id"`
	NodeId   string `json:"nodeId"`
	NodeName string `json:"nodeName"`
}

type editTopic struct {
	Id         int      `json:"id"`
	Title      string   `json:"title"`
	NodeId     string   `json:"nodeId"`
	Content    string   `json:"content"`
	Tags       []string `json:"tags"`
	EditorType string   `json:"editorType"`
}

type editReply struct {
	Id         int    `json:"id"`
	Content    string `json:"content"`
	EditorType string `json:"editorType"`
}

type fileDescribe struct {
	Desc     string `json:"desc"`
	FileName string `json:"fileName"`
}

type fileNumResp struct {
	Num    int `json:"num"`
	MaxNum int `json:"maxNum"`
}

type addNodeModerator struct {
	NodeId   string `json:"nodeId"`
	MemberId string `json:"memberId"`
}

type deleteNodeModerator struct {
	NodeId   string `json:"nodeId"`
	MemberId string `json:"memberId"`
}

type adminNodeInfo struct {
	NodeInfo     object.Node `json:"nodeInfo"`
	TopicNum     int         `json:"topicNum"`
	FavoritesNum int         `json:"favoritesNum"`
}
