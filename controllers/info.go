// Copyright 2021 The casbin Authors. All Rights Reserved.
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
	"sync"

	"github.com/casbin/casnode/object"
)

// @Tag Info API
// @Title GetCommunityHealth
// @router /get-community-health [get]
func (c *ApiController) GetCommunityHealth() {
	var memberCount int
	var topicCount int
	var replyCount int

	var wg sync.WaitGroup
	wg.Add(3)

	go func() {
		defer wg.Done()
		memberCount = object.GetMemberNum()
	}()
	go func() {
		defer wg.Done()
		topicCount = object.GetTopicCount()
	}()
	go func() {
		defer wg.Done()
		replyCount = object.GetReplyCount()
	}()

	wg.Wait()

	res := object.CommunityHealth{
		Member: memberCount,
		Topic:  topicCount,
		Reply:  replyCount,
	}

	c.ResponseOk(res)
}

// @Tag Info API
// @Title GetForumVersion
// @router /get-forum-version [get]
func (c *ApiController) GetForumVersion() {
	var resp Response

	res := object.GetForumVersion()

	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Tag Info API
// @Title GetOnlineNum
// @router /get-online-num [get]
func (c *ApiController) GetOnlineNum() {
	onlineNum := object.GetOnlineMemberNum()
	highest := object.GetHighestOnlineNum()

	c.ResponseOk(onlineNum, highest)
}

// @Tag Info API
// @Title GetNodeNavigation
// @router /node-navigation [get]
func (c *ApiController) GetNodeNavigation() {
	var resp Response

	res := object.GetNodeNavigation()
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}
