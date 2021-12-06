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
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

// @Tag Hot API
// @Title ChangeExpiredDataStatus
// @router /update-expired-data [post]
func (c *ApiController) ChangeExpiredDataStatus() {
	expiredNodeDate := util.GetTimeMonth(-object.NodeHitRecordExpiredTime)
	expiredTopicDate := util.GetTimeDay(-object.TopicHitRecordExpiredTime)

	updateNodeNum := object.ChangeExpiredDataStatus(1, expiredNodeDate)
	updateTopicNum := object.ChangeExpiredDataStatus(2, expiredTopicDate)

	c.Data["json"] = Response{Status: "ok", Data: updateNodeNum, Data2: updateTopicNum}
	c.ServeJSON()
}

// @Tag Hot API
// @Title UpdateHotInfo
// @router /update-hot-info [post]
func (c *ApiController) UpdateHotInfo() {
	var updateNodeNum int
	var updateTopicNum int
	last := object.GetLastRecordId()
	latest := object.GetLatestSyncedRecordId()
	if last != latest {
		object.UpdateLatestSyncedRecordId(last)
		updateNodeNum = object.UpdateHotNode(latest)
		updateTopicNum = object.UpdateHotTopic(latest)
	}

	c.Data["json"] = Response{Status: "ok", Data: updateNodeNum, Data2: updateTopicNum}
	c.ServeJSON()
}
