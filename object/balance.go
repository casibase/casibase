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

func GetConsumptionRecordCount() int {
	count, err := adapter.Engine.Count(&ConsumptionRecord{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

/*
func GetConsumptionRecordId() int {
	num := GetConsumptionRecordCount()

	res := num + 1

	return res
}
*/

func GetMemberBalance(id string) int {
	member := GetMember(id)
	if member == nil {
		return 0
	}
	return member.Score
}

func UpdateMemberBalances(id string, amount int) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}

	member.Score += amount

	return UpdateMemberToCasdoor(member)
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

func CreateTopicConsumption(consumerId string, id int) bool {
	record := ConsumptionRecord{
		//Id:              util.IntToString(GetConsumptionRecordId()),
		ReceiverId:      consumerId,
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 8,
	}
	record.Amount = CreateTopicCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(consumerId)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalances(consumerId, record.Amount)

	return true
}

func CreateReplyConsumption(consumerId string, id int) bool {
	record := ConsumptionRecord{
		//Id:              util.IntToString(GetConsumptionRecordId()),
		ReceiverId:      consumerId,
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 6,
	}
	record.Amount = CreateReplyCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(consumerId)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalances(consumerId, record.Amount)

	return true
}

func GetReplyBonus(author, consumerId string, id int) {
	if author == consumerId {
		return
	}

	record := ConsumptionRecord{
		//Id:              util.IntToString(GetConsumptionRecordId()),
		ConsumerId:      consumerId,
		ReceiverId:      author,
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 7,
	}
	record.Amount = ReceiveReplyBonus
	balance := GetMemberBalance(consumerId)
	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalances(author, record.Amount)
}

func TopTopicConsumption(consumerId string, id int) bool {
	record := ConsumptionRecord{
		ReceiverId:      consumerId,
		ObjectId:        id,
		CreatedTime:     util.GetCurrentTime(),
		ConsumptionType: 9,
	}
	record.Amount = TopTopicCost
	record.Amount = -record.Amount
	balance := GetMemberBalance(consumerId)
	if balance+record.Amount < 0 {
		return false
	}

	record.Balance = balance + record.Amount
	AddBalance(&record)
	UpdateMemberBalances(consumerId, record.Amount)

	return true
}
