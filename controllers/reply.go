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
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

type NewReplyForm struct {
	Content string `json:"content"`
	TopicId int    `json:"topicId"`
}

// @Title GetReplies
// @Tag Reply API
// @router /get-replies [get]
func (c *ApiController) GetReplies() {
	user := c.GetSessionUser()

	topicIdStr := c.Input().Get("topicId")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	initStatus := c.Input().Get("init")

	topicId := util.ParseInt(topicIdStr)

	var limit, page int
	repliesNum := object.GetTopicReplyNum(topicId)

	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		c.Data["json"] = Response{Status: "error", Msg: "Parameter missing: limit"}
		c.ServeJSON()
		return
	}
	if len(pageStr) != 0 {
		if initStatus == "false" {
			page = util.ParseInt(pageStr)
		} else {
			page = (repliesNum-1)/limit + 1
		}
	}

	replies, realPage := object.GetReplies(topicId, user, limit, page)
	if replies == nil {
		replies = []*object.ReplyWithAvatar{}
	}

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: replies, Data2: []int{repliesNum, realPage}}
	c.ServeJSON()
}

// @Title GetAllRepliesOfTopic
// @Tag Reply API
// @router /get-replies-of-topic [get]
func (c *ApiController) GetAllRepliesOfTopic() {
	topicId := util.ParseInt(c.Input().Get("topicId"))
	replies := object.GetRepliesOfTopic(topicId)
	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: replies, Data2: len(replies)}
	c.ServeJSON()
}

// @Title GetReply
// @Tag Reply API
// @router /get-reply [get]
func (c *ApiController) GetReply() {
	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)

	c.Data["json"] = object.GetReply(id)
	c.ServeJSON()
}

// @Title GetReplyWithDetails
// @Tag Reply API
// @router /get-reply-with-details [get]
func (c *ApiController) GetReplyWithDetails() {
	user := c.GetSessionUser()

	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)

	c.Data["json"] = object.GetReplyWithDetails(user, id)
	c.ServeJSON()
}

// @Title UpdateReply
// @Tag Reply API
// @router /update-reply [post]
func (c *ApiController) UpdateReply() {
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

// @Title AddReply
// @Tag Reply API
// @router /add-reply [post]
func (c *ApiController) AddReply() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	if object.IsForbidden(user) {
		c.ResponseError("Your account has been forbidden to perform this operation")
		return
	}

	balance := object.GetMemberBalance(user)
	if balance < object.CreateReplyCost {
		c.ResponseError("You don't have enough balance.")
		return
	}

	reply := object.Reply{
		Author:      GetUserName(user),
		CreatedTime: util.GetCurrentTime(),
		Deleted:     false,
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &reply)
	if err != nil {
		panic(err)
	}

	reply.Tags = service.Finalword(reply.Content)

	previousReply := object.GetReplyByContentAndAuthor(reply.Content, reply.Author)
	if previousReply != nil {
		c.ResponseError("You have same reply before.")
		return
	}

	if object.ContainsSensitiveWord(reply.Content) {
		c.ResponseError("Reply contains sensitive word.")
		return
	}

	affected, id := object.AddReply(&reply)
	if affected {
		object.GetReplyBonus(object.GetTopicAuthor(reply.TopicId), user, id)
		object.CreateReplyConsumption(user, id)

		c.UpdateAccountBalance(-object.CreateReplyCost)
		c.UpdateAccountConsumptionSum(object.CreateReplyCost)
		object.ChangeTopicReplyCount(reply.TopicId, 1)
		object.ChangeTopicLastReplyUser(reply.TopicId, GetUserName(user), util.GetCurrentTime())
		object.AddReplyNotification(reply.Author, reply.Content, id, reply.TopicId)
		reply.AddReplyToMailingList()
	}

	c.ResponseOk(affected)
}

// @Title DeleteReply
// @Tag Reply API
// @router /delete-reply [post]
func (c *ApiController) DeleteReply() {
	id := util.ParseInt(c.Input().Get("id"))

	user := c.GetSessionUser()

	replyInfo := object.GetReply(id)
	isAdmin := object.CheckIsAdmin(user)
	if !object.ReplyDeletable(replyInfo.CreatedTime, GetUserName(user), replyInfo.Author) && !isAdmin {
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

	c.ResponseOk(affected)
}

// @Title GetLatestReplies
// @Tag Reply API
// @router /get-latest-replies [get]
func (c *ApiController) GetLatestReplies() {
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

// @Title GetMemberRepliesNum
// @Tag Reply API
// @router /get-member-replies-num [get]
// @Description GetRepliesNum gets member's all replies num.
func (c *ApiController) GetMemberRepliesNum() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberRepliesNum(id)
	c.ServeJSON()
}
