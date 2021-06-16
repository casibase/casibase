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
	"math/rand"
	"time"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

func (c *ApiController) AddThanks() {
	memberId := c.GetSessionUsername()
	idStr := c.Input().Get("id")
	thanksType := c.Input().Get("thanksType") //1 means topic, 2 means reply

	var author string
	id := util.ParseInt(idStr)
	if thanksType == "2" {
		author = object.GetReplyAuthor(id)
	} else {
		author = object.GetTopicAuthor(id)
	}

	consumerRecord := object.ConsumptionRecord{
		//Id:          util.IntToString(object.GetConsumptionRecordId()),
		ConsumerId:  author,
		ReceiverId:  memberId,
		ObjectId:    id,
		CreatedTime: util.GetCurrentTime(),
	}

	receiverRecord := object.ConsumptionRecord{
		//Id:          util.IntToString(object.GetConsumptionRecordId() + 1),
		ConsumerId:  memberId,
		ReceiverId:  author,
		ObjectId:    id,
		CreatedTime: util.GetCurrentTime(),
	}

	var resp Response
	if thanksType == "2" || thanksType == "1" {
		if thanksType == "2" {
			consumerRecord.Amount = object.ReplyThanksCost
			consumerRecord.Amount = -consumerRecord.Amount
			receiverRecord.Amount = object.ReplyThanksCost
			consumerRecord.ConsumptionType = 5
			receiverRecord.ConsumptionType = 3
		} else {
			consumerRecord.Amount = object.TopicThanksCost
			consumerRecord.Amount = -consumerRecord.Amount
			receiverRecord.Amount = object.TopicThanksCost
			consumerRecord.ConsumptionType = 4
			receiverRecord.ConsumptionType = 2
		}
		consumerRecord.Balance = object.GetMemberBalance(memberId) + consumerRecord.Amount
		if consumerRecord.Balance < 0 {
			resp = Response{Status: "fail", Msg: "You don't have enough balance."}
			c.Data["json"] = resp
			c.ServeJSON()
			return
		}
		receiverRecord.Balance = object.GetMemberBalance(memberId) + receiverRecord.Amount
		object.AddBalance(&receiverRecord)
		object.AddBalance(&consumerRecord)
		object.UpdateMemberBalances(memberId, consumerRecord.Amount)
		object.UpdateMemberBalances(author, receiverRecord.Amount)
		if thanksType == "2" {
			object.AddReplyThanksNum(id)
		}

		c.UpdateAccountBalance(consumerRecord.Balance)

		resp = Response{Status: "ok", Msg: "success"}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetConsumptionRecord() {
	memberId := c.GetSessionUsername()
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultBalancePageNum

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

	var resp Response
	res := object.GetMemberConsumptionRecord(memberId, limit, offset)
	num := object.GetMemberConsumptionRecordNum(memberId)
	resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetCheckinBonus() {
	memberId := c.GetSessionUsername()

	checkinDate := object.GetMemberCheckinDate(memberId)
	date := util.GetDateStr()
	if date == checkinDate {
		resp := Response{Status: "fail", Msg: "You have received the daily checkin bonus today."}
		c.Data["json"] = resp
		c.ServeJSON()
	}

	var resp Response
	maxBonus := object.MaxDailyCheckinBonus
	rand.Seed(time.Now().UnixNano())
	bonus := rand.Intn(maxBonus)

	record := object.ConsumptionRecord{
		//Id:              util.IntToString(object.GetConsumptionRecordId() + 1),
		Amount:          bonus,
		Balance:         object.GetMemberBalance(memberId) + bonus,
		ReceiverId:      memberId,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 1,
	}
	object.AddBalance(&record)
	object.UpdateMemberBalances(memberId, bonus)
	object.UpdateMemberCheckinDate(memberId, date)

	c.UpdateAccountBalance(record.Balance)

	resp = Response{Status: "ok", Msg: "success", Data: bonus}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetCheckinBonusStatus() {
	memberId := c.GetSessionUsername()

	checkinDate := object.GetMemberCheckinDate(memberId)
	date := util.GetDateStr()

	res := checkinDate == date

	resp := Response{Status: "ok", Msg: "success", Data: res, Data2: date}

	c.Data["json"] = resp
	c.ServeJSON()
}
