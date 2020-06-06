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

type Reply struct {
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Author      string `xorm:"varchar(100)" json:"author"`
	TopicId     string `xorm:"varchar(100)" json:"topicId"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	Content string `xorm:"mediumtext" json:"content"`
}

func GetReplies(topicId string) []*Reply {
	replies := []*Reply{}
	err := adapter.engine.Asc("created_time").Find(&replies, &Reply{TopicId: topicId})
	if err != nil {
		panic(err)
	}

	return replies
}

func GetReply(id string) *Reply {
	reply := Reply{Id: id}
	existed, err := adapter.engine.Get(&reply)
	if err != nil {
		panic(err)
	}

	if existed {
		return &reply
	} else {
		return nil
	}
}

func UpdateReply(id string, reply *Reply) bool {
	if GetReply(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).AllCols().Update(reply)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddReply(reply *Reply) bool {
	affected, err := adapter.engine.Insert(reply)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteReply(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Reply{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
