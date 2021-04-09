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
	"strconv"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

type NewReplyForm struct {
	Content string `json:"content"`
	TopicId int    `json:"topicId"`
}

func (c *APIController) GetReplies() {
	memberId := c.GetSessionUser()
	topicIdStr := c.Input().Get("topicId")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	initStatus := c.Input().Get("init")

	defaultLimit := object.DefaultTopicPageReplyNum
	topicId := util.ParseInt(topicIdStr)

	var limit, offset, page int
	repliesNum := object.GetTopicReplyNum(topicId)
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		if initStatus == "false" {
			page = util.ParseInt(pageStr)
		} else {
			page = repliesNum/limit + 1
		}
		offset = page*limit - limit
	}

	replies := object.GetReplies(topicId, memberId, limit, offset)

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: replies, Data2: []int{repliesNum, page}}
	c.ServeJSON()
}

func (c *APIController) GetAllRepliesOfTopic() {
	topicId := util.ParseInt(c.Input().Get("topicId"))
	replies := object.GetRepliesOfTopic(topicId)
	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: replies, Data2: len(replies)}
	c.ServeJSON()
}

func (c *APIController) GetReply() {
	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)

	c.Data["json"] = object.GetReply(id)
	c.ServeJSON()
}

func (c *APIController) GetReplyWithDetails() {
	memberId := c.GetSessionUser()
	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)

	c.Data["json"] = object.GetReplyWithDetails(memberId, id)
	c.ServeJSON()
}

func (c *APIController) UpdateReply() {
	idStr := c.Input().Get("id")

	var reply object.Reply
	id := util.ParseInt(idStr)
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &reply)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateReply(id, &reply)
	c.ServeJSON()
}

func (c *APIController) AddReply() {
	if c.RequireLogin() {
		return
	}

	memberId := c.GetSessionUser()
	// check account status
	if object.IsMuted(memberId) || object.IsForbidden(memberId) {
		c.mutedAccountResp(memberId)
		return
	}

	var form NewReplyForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}
	content, topicId := form.Content, form.TopicId

	if object.ContainsSensitiveWord(content) {
		resp := Response{Status: "fail", Msg: "Reply contains sensitive word."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	reply := object.Reply{
		//Id:          util.IntToString(object.GetReplyId()),
		Author:      memberId,
		TopicId:     topicId,
		CreatedTime: util.GetCurrentTime(),
		Content:     content,
		Deleted:     false,
	}

	err = json.Unmarshal(c.Ctx.Input.RequestBody, &reply)
	if err != nil {
		panic(err)
	}

	balance := object.GetMemberBalance(memberId)
	if balance < object.CreateReplyCost {
		resp := Response{Status: "fail", Msg: "You don't have enough balance."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	affected, id := object.AddReply(&reply)
	if affected {
		object.GetReplyBonus(object.GetTopicAuthor(reply.TopicId), reply.Author, id)
		object.CreateReplyConsumption(reply.Author, id)
		object.ChangeTopicReplyCount(topicId, 1)
		object.ChangeTopicLastReplyUser(topicId, memberId, util.GetCurrentTime())
		object.AddReplyNotification(reply.Author, reply.Content, id, reply.TopicId)
	}

	c.wrapResponse(affected)
}

func (c *APIController) DeleteReply() {
	idStr := c.Input().Get("id")

	memberId := c.GetSessionUser()
	id := util.ParseInt(idStr)
	replyInfo := object.GetReply(id)
	isModerator := object.CheckModIdentity(memberId)
	if !object.ReplyDeletable(replyInfo.CreatedTime, memberId, replyInfo.Author) && !isModerator {
		resp := Response{Status: "fail", Msg: "Permission denied."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	affected := object.DeleteReply(id)
	if affected {
		object.ChangeTopicReplyCount(replyInfo.TopicId, -1)
		lastReply := object.GetLatestReplyInfo(replyInfo.TopicId)
		if lastReply != nil {
			object.ChangeTopicLastReplyUser(replyInfo.TopicId, lastReply.Author, lastReply.CreatedTime)
		} else {
			object.ChangeTopicLastReplyUser(replyInfo.TopicId, "", "")
		}
	}

	c.wrapResponse(affected)
}

func (c *APIController) GetLatestReplies() {
	id := c.Input().Get("id")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultPageNum
	var (
		limit, offset int
		err           error
	)
	if len(limitStr) != 0 {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			panic(err)
		}
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page, err := strconv.Atoi(pageStr)
		if err != nil {
			panic(err)
		}
		offset = page*limit - limit
	}

	c.Data["json"] = object.GetLatestReplies(id, limit, offset)
	c.ServeJSON()
}

// GetRepliesNum gets member's all replies num.
func (c *APIController) GetMemberRepliesNum() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberRepliesNum(id)
	c.ServeJSON()
}
