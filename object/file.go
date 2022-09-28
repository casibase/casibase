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

import "github.com/casdoor/casdoor-go-sdk/casdoorsdk"

type UploadFileRecord struct {
	Id          int    `xorm:"int notnull pk autoincr" json:"id"`
	FileName    string `xorm:"varchar(100)" json:"fileName"`
	FilePath    string `xorm:"varchar(100)" json:"filePath"`
	FileUrl     string `xorm:"varchar(100)" json:"fileUrl"`
	FileType    string `xorm:"varchar(10)" json:"fileType"`
	FileExt     string `xorm:"varchar(20)" json:"fileExt"`
	MemberId    string `xorm:"varchar(100) index" json:"memberId"`
	CreatedTime string `xorm:"varchar(40)" json:"createdTime"`
	Size        int    `xorm:"int" json:"size"`
	Views       int    `xorm:"int" json:"views"`
	Desc        string `xorm:"varchar(500)" json:"desc"`
	Deleted     bool   `xorm:"bool" json:"-"`
}

func AddFileRecord(record *UploadFileRecord) (bool, int) {
	affected, err := adapter.Engine.Insert(record)
	if err != nil {
		panic(err)
	}

	return affected != 0, record.Id
}

func GetFile(id int) *UploadFileRecord {
	file := UploadFileRecord{Id: id}
	existed, err := adapter.Engine.Get(&file)
	if err != nil {
		panic(err)
	}

	if existed {
		return &file
	} else {
		return nil
	}
}

func GetFiles(memberId string, limit, offset int) []*UploadFileRecord {
	records := []*UploadFileRecord{}
	err := adapter.Engine.Desc("created_time").Where("member_id = ?", memberId).And("deleted = ?", 0).Limit(limit, offset).Find(&records)
	if err != nil {
		panic(err)
	}

	return records
}

//func GetFilesByMember(memberId string) []*UploadFileRecord {
//	records := []*UploadFileRecord{}
//	err := adapter.Engine.Where("member_id = ?", memberId).Find(&records)
//	if err != nil {
//		panic(err)
//	}
//
//	return records
//}

func DeleteFilesByMember(memberId string) bool {
	affected, err := adapter.Engine.Where("member_id = ?", memberId).Delete(&UploadFileRecord{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetFilesNum(memberId string) int {
	var total int64
	var err error

	record := new(UploadFileRecord)
	total, err = adapter.Engine.Where("member_id = ?", memberId).And("deleted = ?", 0).Count(record)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func DeleteFileRecord(id int) bool {
	record := new(UploadFileRecord)
	record.Deleted = true
	affected, err := adapter.Engine.Id(id).Cols("deleted").Update(record)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func FileEditable(user *casdoorsdk.User, author string) bool {
	if CheckIsAdmin(user) {
		return true
	}

	if GetUserName(user) != author {
		return false
	}

	return true
}

func AddFileViewsNum(id int) bool {
	file := GetFile(id)
	if file == nil {
		return false
	}

	file.Views++
	affected, err := adapter.Engine.Id(id).Cols("views").Update(file)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func UpdateFileDescribe(id int, fileName, desc string) bool {
	file := GetFile(id)
	if file == nil {
		return false
	}

	file.Desc = desc
	file.FileName = fileName
	affected, err := adapter.Engine.Id(id).Cols("desc, file_name").Update(file)
	if err != nil {
		panic(err)
	}

	return affected != 0
}
