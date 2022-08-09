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

func (c *ApiController) AddNotification() {
	var tempNotification newNotification
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tempNotification)
	if err != nil {
		panic(err)
	}

	memberId := c.GetSessionUsername()
	notification := object.Notification{
		// Id:               util.IntToString(object.GetNotificationId()),
		NotificationType: tempNotification.NotificationType,
		ObjectId:         tempNotification.ObjectId,
		CreatedTime:      util.GetCurrentTime(),
		SenderId:         memberId,
		ReceiverId:       tempNotification.ReceiverId,
		Status:           1,
	}

	var resp Response
	if notification.NotificationType <= 6 && notification.NotificationType >= 1 {
		res := object.AddNotification(&notification)
		if !res {
			resp = Response{Status: "fail", Msg: "add notification wrong"}
		} else {
			resp = Response{Status: "ok", Msg: "success", Data: res}
		}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @router /get-notifications [get]
// @Title GetNotifications
// @Tag Notification API
func (c *ApiController) GetNotifications() {
	memberId := c.GetSessionUsername()
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultNotificationPageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	res := object.GetNotifications(memberId, limit, offset)
	num := object.GetNotificationNum(memberId)
	c.ResponseOk(res, num)
}

// @Title DeleteNotification
// @router /delete-notifications [get]
// @Tag Notification API
func (c *ApiController) DeleteNotification() {
	id := c.Input().Get("id")

	res := object.DeleteNotification(id)
	c.ResponseOk(res)
}

// @Title GetUnreadNotificationNum
// @router /get-unread-notification-num [post]
// @Tag Notification API
func (c *ApiController) GetUnreadNotificationNum() {
	memberId := c.GetSessionUsername()

	res := object.GetUnreadNotificationNum(memberId)
	c.ResponseOk(res)
}

// @Title UpdateReadStatus
// @router /update-read-status [post]
// @Tag Notification API
func (c *ApiController) UpdateReadStatus() {
	memberId := c.GetSessionUsername()

	c.Data["json"] = object.UpdateReadStatus(memberId)
	c.ServeJSON()
}
