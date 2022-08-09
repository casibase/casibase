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

// RecordType: 1 means node hit record
type BrowseRecord struct {
	Id          int    `xorm:"int notnull pk autoincr" json:"id"`
	MemberId    string `xorm:"varchar(100)" json:"memberId"`
	RecordType  int    `xorm:"int" json:"recordType"`
	ObjectId    string `xorm:"varchar(100) index" json:"objectId"`
	CreatedTime string `xorm:"varchar(40) index" json:"createdTime"`
	Expired     bool   `xorm:"bool" json:"expired"`
}

func GetBrowseRecordNum(recordType int, objectId string) int {
	record := new(BrowseRecord)
	total, err := adapter.Engine.Where("object_id = ?", objectId).And("record_type = ?", recordType).And("expired = ?", false).Count(record)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func DeletedExpiredData(recordType int, date string) bool {
	affected, err := adapter.Engine.Where("record_type = ?", recordType).And("date < ?", date).Delete(&BrowseRecord{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddBrowseRecordNum(record *BrowseRecord) bool {
	affected, err := adapter.Engine.Insert(record)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeExpiredDataStatus(recordType int, date string) int {
	var res int
	record := new(BrowseRecord)
	record.Expired = true
	affected, err := adapter.Engine.Where("record_type = ?", recordType).And("expired = ?", 0).And("created_time < ?", date).Cols("expired").Update(record)
	res += int(affected)
	if err != nil {
		panic(err)
	}

	return res
}

func GetLastRecordId() int {
	record := new(BrowseRecord)
	_, err := adapter.Engine.Desc("id").Cols("id").Limit(1).Get(record)
	if err != nil {
		panic(err)
	}

	res := record.Id

	return res
}

func UpdateHotNode(last int) int {
	var record []*BrowseRecord
	err := adapter.Engine.Table("browse_record").Where("id > ?", last).And("record_type = ?", 1).GroupBy("object_id").Find(&record)
	if err != nil {
		panic(err)
	}

	for _, v := range record {
		hot := GetBrowseRecordNum(1, v.ObjectId)
		UpdateNodeHotInfo(v.ObjectId, hot)
	}

	return len(record)
}

func UpdateHotTopic(last int) int {
	var record []*BrowseRecord
	err := adapter.Engine.Table("browse_record").Where("id > ? ", last).And("record_type = ?", 2).GroupBy("object_id").Find(&record)
	if err != nil {
		panic(err)
	}

	for _, v := range record {
		hot := GetBrowseRecordNum(2, v.ObjectId)
		UpdateTopicHotInfo(v.ObjectId, hot)
	}

	return len(record)
}
