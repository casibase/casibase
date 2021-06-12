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
	"time"
)

type Reply struct {
	Id          int    `xorm:"int notnull pk autoincr" json:"id"`
	Author      string `xorm:"varchar(100) index" json:"author"`
	TopicId     int    `xorm:"int index" json:"topicId"`
	CreatedTime string `xorm:"varchar(40)" json:"createdTime"`
	Deleted     bool   `xorm:"bool" json:"-"`
	ThanksNum   int    `xorm:"int" json:"thanksNum"`
	EditorType  string `xorm:"varchar(40)" json:"editorType"`
	Content     string `xorm:"mediumtext" json:"content"`
}

// GetReplyCount returns all replies num so far, both deleted and not deleted.
func GetReplyCount() int {
	count, err := adapter.Engine.Count(&Reply{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

// GetReplies returns more information about reply of a topic.
func GetReplies(topicId int, memberId string, limit int, offset int) []*ReplyWithAvatar {
	replies := []*ReplyWithAvatar{}
	err := adapter.Engine.Table("reply").
		Join("LEFT OUTER", "consumption_record", "consumption_record.object_id = reply.id and consumption_record.consumption_type = ?", 5).
		Where("reply.topic_id = ?", topicId).And("reply.deleted = ?", 0).
		Asc("reply.created_time").
		Cols("reply.*, consumption_record.amount").
		Limit(limit, offset).Find(&replies)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()
	for _, r := range replies {
		r.Avatar = memberAvatar[r.Author]
	}

	isModerator := CheckModIdentity(memberId)
	for _, v := range replies {
		v.ThanksStatus = v.ConsumptionAmount != 0
		v.Deletable = isModerator || ReplyDeletable(v.CreatedTime, memberId, v.Author)
		v.Editable = isModerator || GetReplyEditableStatus(memberId, v.Author, v.CreatedTime)
	}

	return replies
}

func GetRepliesOfTopic(topicId int) []Reply {
	var ret []Reply
	err := adapter.Engine.Where("topic_id = ?", topicId).And("deleted = ?", 0).Find(&ret)
	if err != nil {
		panic(err)
	}
	return ret
}

// GetTopicReplyNum returns topic's reply num.
func GetTopicReplyNum(topicId int) int {
	var total int64
	var err error

	reply := new(Reply)
	total, err = adapter.Engine.Where("topic_id = ?", topicId).And("deleted = ?", 0).Count(reply)
	if err != nil {
		panic(err)
	}

	return int(total)
}

// GetLatestReplyInfo returns topic's latest reply information.
func GetLatestReplyInfo(topicId int) *Reply {
	var reply Reply
	exist, err := adapter.Engine.Where("topic_id = ?", topicId).And("deleted = ?", false).Desc("created_time").Limit(1).Omit("content").Get(&reply)
	if err != nil {
		panic(err)
	}

	if exist {
		return &reply
	}
	return nil
}

// GetReply returns a single reply.
func GetReply(id int) *Reply {
	reply := Reply{Id: id}
	existed, err := adapter.Engine.Get(&reply)
	if err != nil {
		panic(err)
	}

	if existed {
		return &reply
	}
	return nil
}

// GetReplyWithDetails returns more information about reply, including avatar, thanks status, deletable and editable.
func GetReplyWithDetails(memberId string, id int) *ReplyWithAvatar {
	reply := ReplyWithAvatar{}
	existed, err := adapter.Engine.Table("reply").
		Join("LEFT OUTER", "consumption_record", "consumption_record.object_id = reply.id and consumption_record.consumption_type = ?", 5).
		Id(id).Cols("reply.*, consumption_record.amount").Get(&reply)
	if err != nil {
		panic(err)
	}

	member := GetMember(memberId)
	if member != nil {
		reply.Avatar = member.Avatar
	}

	isModerator := CheckModIdentity(memberId)
	if existed {
		reply.ThanksStatus = reply.ConsumptionAmount != 0
		reply.Deletable = isModerator || ReplyDeletable(reply.CreatedTime, memberId, reply.Author)
		reply.Editable = isModerator || GetReplyEditableStatus(memberId, reply.Author, reply.CreatedTime)
		return &reply
	}
	return nil
}

/*
func GetReplyId() int {
	reply := new(Reply)
	_, err := adapter.Engine.Desc("created_time").Omit("content").Limit(1).Get(reply)
	if err != nil {
		panic(err)
	}

	res := util.ParseInt(reply.Id) + 1

	return res
}
*/

// UpdateReply updates reply's all field.
func UpdateReply(id int, reply *Reply) bool {
	if GetReply(id) == nil {
		return false
	}
	reply.Content = FilterUnsafeHTML(reply.Content)
	_, err := adapter.Engine.Id(id).AllCols().Update(reply)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

// UpdateReplyWithLimitCols updates reply's not null field.
func UpdateReplyWithLimitCols(id int, reply *Reply) bool {
	if GetReply(id) == nil {
		return false
	}
	reply.Content = FilterUnsafeHTML(reply.Content)
	_, err := adapter.Engine.Id(id).Update(reply)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

// AddReply returns add reply result and reply id.
func AddReply(reply *Reply) (bool, int) {
	//reply.Content = strings.ReplaceAll(reply.Content, "\n", "<br/>")
	reply.Content = FilterUnsafeHTML(reply.Content)
	affected, err := adapter.Engine.Insert(reply)
	if err != nil {
		panic(err)
	}

	return affected != 0, reply.Id
}

/*
func DeleteReply(id string) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Reply{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}
*/

func DeleteRepliesHardByTopicId(topicId int) bool {
	affected, err := adapter.Engine.Where("topic_id = ?", topicId).Delete(&Reply{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// DeleteReply soft delete reply.
func DeleteReply(id int) bool {
	reply := new(Reply)
	reply.Deleted = true
	affected, err := adapter.Engine.Id(id).Cols("deleted").Update(reply)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// GetLatestReplies returns member's latest replies.
func GetLatestReplies(author string, limit int, offset int) []*LatestReply {
	replys := []*LatestReply{}
	err := adapter.Engine.Table("reply").Join("LEFT OUTER", "topic", "topic.id = reply.topic_id").
		Where("reply.author = ?", author).And("reply.deleted = ?", 0).
		Desc("reply.created_time").
		Cols("reply.content, reply.author, reply.created_time, topic.id, topic.node_id, topic.node_name, topic.title").
		Limit(limit, offset).Find(&replys)
	if err != nil {
		panic(err)
	}

	return replys
}

// GetMemberRepliesNum returns member's all replies num.
func GetMemberRepliesNum(memberId string) int {
	var total int64
	var err error

	reply := new(Reply)
	total, err = adapter.Engine.Where("author = ?", memberId).And("deleted = ?", 0).Count(reply)
	if err != nil {
		panic(err)
	}

	return int(total)
}

// GetReplyTopicTitle only returns reply's topic title.
func GetReplyTopicTitle(id int) string {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Cols("title").Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return topic.Title
	}
	return ""
}

// GetReplyAuthor only returns reply's topic author.
func GetReplyAuthor(id int) string {
	reply := Reply{Id: id}
	existed, err := adapter.Engine.Cols("author").Get(&reply)
	if err != nil {
		panic(err)
	}

	if existed {
		return reply.Author
	}
	return ""
}

// AddReplyThanksNum updates reply's thanks num.
func AddReplyThanksNum(id int) bool {
	reply := GetReply(id)
	if reply == nil {
		return false
	}

	reply.ThanksNum++
	affected, err := adapter.Engine.Id(id).Cols("thanks_num").Update(reply)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// ReplyDeletable checks whether the reply can be deleted.
func ReplyDeletable(date, memberId, author string) bool {
	if memberId != author {
		return false
	}

	t, err := time.Parse("2006-01-02T15:04:05+08:00", date)
	if err != nil {
		return false
	}
	h, _ := time.ParseDuration("-1h")
	t = t.Add(8 * h)

	now := time.Now()
	if now.Sub(t).Minutes() > ReplyDeletableTime {
		return false
	}

	return true
}

// GetReplyEditableStatus checks whether the reply can be edited.
func GetReplyEditableStatus(member, author, createdTime string) bool {
	if member != author {
		return false
	}

	t, err := time.Parse("2006-01-02T15:04:05+08:00", createdTime)
	if err != nil {
		return false
	}
	h, _ := time.ParseDuration("-1h")
	t = t.Add(8 * h)

	now := time.Now()
	if now.Sub(t).Minutes() > ReplyEditableTime {
		return false
	}

	return true
}

func SearchReplies(keyword string) []Reply {
	var ret []Reply
	keyword = fmt.Sprintf("%%%s%%", keyword)

	err := adapter.Engine.Where("deleted = 0").Where("content like ?", keyword).Find(&ret)
	if err != nil {
		panic(err)
	}

	return ret
}
