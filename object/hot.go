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
	"fmt"

	"github.com/casbin/casbin-forum/util"
)

//RecordType: 1 means node hit record
type BrowseRecord struct {
	Id          int    `xorm:"int notnull pk autoincr" json:"id"`
	MemberId    string `xorm:"varchar(100)" json:"memberId"`
	RecordType  int    `xorm:"int" json:"recordType"`
	ObjectId    string `xorm:"varchar(100)" json:"objectId"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	Expired     bool   `xorm:"bool" json:"expired"`
}

func GetBrowseRecordNum(from, recordType int, date, objectId string) int {
	fmt.Println(from, recordType, date, objectId)
	record := new(BrowseRecord)
	total, err := adapter.engine.Where("id > ?", from).And("record_type = ?", recordType).And("object_id = ?", objectId).And("created_time > ?", date).Count(record)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func DeletedExpiredData(recordType int, date string) bool {
	affected, err := adapter.engine.Where("record_type = ?", recordType).And("date < ?", date).Delete(&BrowseRecord{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddBrowseRecordNum(record *BrowseRecord) bool {
	affected, err := adapter.engine.Insert(record)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeExpiredDataStatus(recordType int, date string) int {
	var res int
	if recordType == 1 {
		nodes := GetNodes()
		for _, v := range nodes {
			record := new(BrowseRecord)
			record.Expired = true
			affected, err := adapter.engine.Where("record_type = ?", 1).And("object_id = ?", v.Id).And("expired = ?", 0).And("created_time < ?", date).Cols("expired").Update(record)
			res += int(affected)
			if err != nil {
				panic(err)
			}
		}
	}

	return res
}

func GetLastRecordId() int {
	record := new(BrowseRecord)
	_, err := adapter.engine.Desc("id").Cols("id").Limit(1).Get(record)
	if err != nil {
		panic(err)
	}

	res := record.Id

	return res
}

func UpdateHottestNode() int {
	from := GetLatestSyncedHitId()
	nodes := GetNodes()

	for _, v := range nodes {
		date := util.GetTimeMonth(-NodeHitRecordExpiredTime)
		addition := GetBrowseRecordNum(from, 1, date, v.Id)
		UpdateNodeHotInfo(v.Id, addition)
	}

	id := GetLastRecordId()
	UpdateLatestSyncedHitId(id)

	return len(nodes)
}
