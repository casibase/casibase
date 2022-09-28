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
	"fmt"
	"math/rand"
	"time"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

// @Tag Balance API
// @Title AddThanks
// @router /add-thanks [post]
func (c *ApiController) AddThanks() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	id := util.ParseInt(c.Input().Get("id"))
	thanksType := c.Input().Get("thanksType") // 1 means topic, 2 means reply

	var author *casdoorsdk.User
	if thanksType == "2" {
		author = object.GetReplyAuthor(id)
	} else {
		author = object.GetTopicAuthor(id)
	}

	consumerRecord := object.ConsumptionRecord{
		ConsumerId:  author.Name,
		ReceiverId:  GetUserName(user),
		ObjectId:    id,
		CreatedTime: util.GetCurrentTime(),
	}

	receiverRecord := object.ConsumptionRecord{
		ConsumerId:  GetUserName(user),
		ReceiverId:  author.Name,
		ObjectId:    id,
		CreatedTime: util.GetCurrentTime(),
	}

	if thanksType == "2" || thanksType == "1" {
		if thanksType == "2" {
			consumerRecord.Amount = -object.ReplyThanksCost
			receiverRecord.Amount = object.ReplyThanksCost
			consumerRecord.ConsumptionType = 5
			receiverRecord.ConsumptionType = 3
		} else {
			consumerRecord.Amount = -object.TopicThanksCost
			receiverRecord.Amount = object.TopicThanksCost
			consumerRecord.ConsumptionType = 4
			receiverRecord.ConsumptionType = 2
		}

		consumerRecord.Balance = object.GetMemberBalance(user) + consumerRecord.Amount
		if consumerRecord.Balance < 0 {
			c.ResponseError("You don't have enough balance.")
			return
		}

		receiverRecord.Balance = object.GetMemberBalance(user) + receiverRecord.Amount
		object.AddBalance(&receiverRecord)
		object.AddBalance(&consumerRecord)

		_, err := object.UpdateMemberBalance(user, consumerRecord.Amount)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		_, err = object.UpdateMemberBalance(user, receiverRecord.Amount)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if thanksType == "2" {
			object.AddReplyThanksNum(id)
		}

		c.UpdateAccountBalance(consumerRecord.Amount)

		_, err = object.UpdateMemberConsumptionSum(user, -consumerRecord.Amount)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.UpdateAccountConsumptionSum(-consumerRecord.Amount)

		c.ResponseOk()
	} else {
		c.ResponseError(fmt.Sprintf("wrong thanksType: %s", thanksType))
	}
}

// @Tag Balance API
// @Title GetConsumptionRecord
// @router /get-consumption-record [get]
func (c *ApiController) GetConsumptionRecord() {
	username := c.GetSessionUsername()
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

	res := object.GetMemberConsumptionRecord(username, limit, offset)
	num := object.GetMemberConsumptionRecordNum(username)

	c.ResponseOk(res, num)
}

// @Tag Balance API
// @Title GetCheckinBonus
// @router /get-checkin-bonus [get]
func (c *ApiController) GetCheckinBonus() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	checkinDate := object.GetMemberCheckinDate(user)
	date := util.GetDateStr()
	if date == checkinDate {
		c.ResponseError("You have received the daily checkin bonus today.")
		return
	}

	maxBonus := object.MaxDailyCheckinBonus
	rand.Seed(time.Now().UnixNano())
	bonus := rand.Intn(maxBonus)

	record := object.ConsumptionRecord{
		// Id:              util.IntToString(object.GetConsumptionRecordId() + 1),
		Amount:          bonus,
		Balance:         object.GetMemberBalance(user) + bonus,
		ReceiverId:      GetUserName(user),
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 1,
	}
	object.AddBalance(&record)

	_, err := object.UpdateMemberBalance(user, bonus)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	_, err = object.UpdateMemberCheckinDate(user, date)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.UpdateAccountBalance(record.Amount)

	c.ResponseOk(bonus)
}

// @router /get-checkin-bonus-status [get]
// @Tag Balance API
// @Title GetCheckinBonusStatus
func (c *ApiController) GetCheckinBonusStatus() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	checkinDate := object.GetMemberCheckinDate(user)
	date := util.GetDateStr()

	res := checkinDate == date

	c.ResponseOk(res, date)
}
