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
	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

func (c *APIController) ChangeExpiredDataStatus() {
	expiredNodeDate := util.GetTimeMonth(-object.NodeHitRecordExpiredTime)
	expiredTopicDate := util.GetTimeDay(-object.TopicHitRecordExpiredTime)

	updateNodeNum := object.ChangeExpiredDataStatus(1, expiredNodeDate)
	updateTopicNum := object.ChangeExpiredDataStatus(2, expiredTopicDate)

	c.Data["json"] = Response{Status: "ok", Data: updateNodeNum, Data2: updateTopicNum}
	c.ServeJSON()
}

func (c *APIController) UpdateHotInfo() {
	updateNodeNum := object.UpdateHotNode()
	updateTopicNum := object.UpdateHotTopic()

	c.Data["json"] = Response{Status: "ok", Data: updateNodeNum, Data2: updateTopicNum}
	c.ServeJSON()
}
