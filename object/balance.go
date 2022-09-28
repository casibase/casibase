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

import (
	"sync"

	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

// ConsumptionType 1-9 means:
// login bonus, receive thanks(topic), receive thanks(reply), thanks(topic)
// thanks(reply), new reply, receive reply bonus, new topic, top topic.
type ConsumptionRecord struct {
	Id              int    `xorm:"int notnull pk autoincr" json:"id"`
	Amount          int    `xorm:"int" json:"amount"`
	Balance         int    `xorm:"int" json:"balance"`
	ConsumerId      string `xorm:"varchar(100) index" json:"consumerId"`
	ObjectId        int    `xorm:"int index" json:"objectId"`
	ReceiverId      string `xorm:"varchar(100) index" json:"receiverId"`
	CreatedTime     string `xorm:"varchar(40)" json:"createdTime"`
	ConsumptionType int    `xorm:"int" json:"consumptionType"`
}

func GetBalances() []*ConsumptionRecord {
	balances := []*ConsumptionRecord{}
	err := adapter.Engine.Desc("created_time").Find(&balances)
	if err != nil {
		panic(err)
	}

	return balances
}

func GetMemberBalances(id string, limit, offset int) []*ConsumptionRecord {
	balances := []*ConsumptionRecord{}
	err := adapter.Engine.Desc("created_time").Where("receiver_id = ?", id).Find(&balances)
	if err != nil {
		panic(err)
	}

	return balances
}

func AddBalance(balance *ConsumptionRecord) bool {
	affected, err := adapter.Engine.Insert(balance)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetMemberBalance(user *casdoorsdk.User) int {
	return user.Score
}

func UpdateMemberBalance(user *casdoorsdk.User, amount int) (bool, error) {
	user.Score += amount
	return casdoorsdk.UpdateUserForColumns(user, []string{"score"})
}

func UpdateMemberConsumptionSum(user *casdoorsdk.User, amount int) (bool, error) {
	user.Karma += amount
	return casdoorsdk.UpdateUserForColumns(user, []string{"karma"})
}

func GetMemberConsumptionRecordNum(memberId string) int {
	var total int64
	var err error

	record := new(ConsumptionRecord)
	total, err = adapter.Engine.Where("receiver_id = ?", memberId).Count(record)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetMemberConsumptionRecord(id string, limit, offset int) []*BalanceResponse {
	record := GetMemberBalances(id, limit, offset)

	var wg sync.WaitGroup
	errChan := make(chan error, limit+1)
	res := make([]*BalanceResponse, len(record))
	for k, v := range record {
		wg.Add(1)
		go func(k int, v *ConsumptionRecord) {
			defer wg.Done()
			tempRecord := BalanceResponse{
				Amount:          v.Amount,
				ConsumerId:      v.ConsumerId,
				ReceiverId:      v.ReceiverId,
				Balance:         v.Balance,
				CreatedTime:     v.CreatedTime,
				ConsumptionType: v.ConsumptionType,
			}
			switch v.ConsumptionType {
			case 2:
				tempRecord.Title = GetTopicTitle(v.ObjectId)
			case 4:
				tempRecord.Title = GetTopicTitle(v.ObjectId)
				if len(tempRecord.Title) == 0 {
					tempRecord.ConsumptionType = 10
					break
				}
			case 6:
				fallthrough
			case 3:
				fallthrough
			case 5:
				fallthrough
			case 7:
				replyInfo := GetReply(v.ObjectId)
				if replyInfo == nil || replyInfo.Deleted {
					tempRecord.ConsumptionType = 10
					break
				}
				topicInfo := GetTopic(replyInfo.TopicId)
				if topicInfo == nil || topicInfo.Deleted {
					tempRecord.ConsumptionType = 10
					break
				}
				tempRecord.Title = topicInfo.Title
				tempRecord.ObjectId = topicInfo.Id
				tempRecord.Length = len(replyInfo.Content)
			case 8:
				fallthrough
			case 9:
				topicInfo := GetTopic(v.ObjectId)
				if topicInfo == nil || topicInfo.Deleted {
					tempRecord.ConsumptionType = 10
					break
				}
				tempRecord.ObjectId = v.ObjectId
				tempRecord.Title = topicInfo.Title
				tempRecord.Length = len(topicInfo.Content)
			}
			res[k] = &tempRecord
		}(k, v)
	}
	wg.Wait()
	close(errChan)
	if len(errChan) != 0 {
		for v := range errChan {
			panic(v)
		}
	}

	return res
}

func GetThanksStatus(memberId string, id, recordType int) bool {
	record := new(ConsumptionRecord)
	total, err := adapter.Engine.Where("consumption_type = ?", recordType).And("object_id = ?", id).And("receiver_id = ?", memberId).Count(record)
	if err != nil {
		panic(err)
	}

	return total != 0
}

func CreateTopicConsumption(user *casdoorsdk.User, id int) bool {
	record := ConsumptionRecord{
		// Id:              util.IntToString(GetConsumptionRecordId()),
		ReceiverId:      GetUserName(user),
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 8,
	}
	record.Amount = CreateTopicCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(user)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalance(user, record.Amount)
	UpdateMemberConsumptionSum(user, -record.Amount)

	return true
}

func CreateReplyConsumption(user *casdoorsdk.User, id int) bool {
	record := ConsumptionRecord{
		// Id:              util.IntToString(GetConsumptionRecordId()),
		ReceiverId:      GetUserName(user),
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 6,
	}
	record.Amount = CreateReplyCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(user)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalance(user, record.Amount)
	UpdateMemberConsumptionSum(user, -record.Amount)

	return true
}

func GetReplyBonus(author *casdoorsdk.User, consumer *casdoorsdk.User, id int) {
	if author.Name == consumer.Name {
		return
	}

	record := ConsumptionRecord{
		// Id:              util.IntToString(GetConsumptionRecordId()),
		ConsumerId:      consumer.Name,
		ReceiverId:      author.Name,
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 7,
	}
	record.Amount = ReceiveReplyBonus
	balance := GetMemberBalance(consumer)
	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalance(author, record.Amount)
}

func TopTopicConsumption(user *casdoorsdk.User, id int) bool {
	record := ConsumptionRecord{
		ReceiverId:      GetUserName(user),
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 9,
	}
	record.Amount = TopTopicCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(user)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalance(user, record.Amount)
	UpdateMemberConsumptionSum(user, -record.Amount)

	return true
}
