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

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Reply struct {
	Id              int      `xorm:"int notnull pk autoincr" json:"id"`
	Author          string   `xorm:"varchar(100) index" json:"author"`
	TopicId         int      `xorm:"int index" json:"topicId"`
	ParentId        int      `xorm:"int" json:"parentId"`
	Tags            []string `xorm:"varchar(200)" json:"tags"`
	CreatedTime     string   `xorm:"varchar(40)" json:"createdTime"`
	Deleted         bool     `xorm:"bool" json:"deleted"`
	IsHidden        bool     `xorm:"bool" json:"isHidden"`
	ThanksNum       int      `xorm:"int" json:"thanksNum"`
	EditorType      string   `xorm:"varchar(40)" json:"editorType"`
	Content         string   `xorm:"mediumtext" json:"content"`
	Ip              string   `xorm:"varchar(100)" json:"ip"`
	State           string   `xorm:"varchar(100)" json:"state"`
	GitterMessageId string   `xorm:"varchar(100)" json:"gitterMessageId"`
}

var enableNestedReply, _ = beego.AppConfig.Bool("enableNestedReply")

// GetReplyCount returns all replies num so far, both deleted and not deleted.
func GetReplyCount() int {
	count, err := adapter.Engine.Count(&Reply{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

// @Title GetReplies
// @router /get-replies [get]
// @Description GetReplies returns more information about reply of a topic.
// @Tag Reply API
func GetReplies(topicId int, user *casdoorsdk.User, limit int, page int) ([]*ReplyWithAvatar, int) {
	replies := []*ReplyWithAvatar{}
	realPage := page
	err := adapter.Engine.Table("reply").
		Join("LEFT OUTER", "consumption_record", "consumption_record.object_id = reply.id and consumption_record.consumption_type = ?", 5).
		Where("reply.topic_id = ?", topicId).
		Asc("reply.created_time").
		Cols("reply.*, consumption_record.amount").
		Find(&replies)
	if err != nil {
		panic(err)
	}

	for _, reply := range replies {
		reply.Avatar = getUserAvatar(reply.Author)
	}

	isAdmin := CheckIsAdmin(user)
	for _, v := range replies {
		v.ThanksStatus = v.ConsumptionAmount != 0
		v.Deletable = isAdmin || ReplyDeletable(v.CreatedTime, GetUserName(user), v.Author)
		v.Editable = isAdmin || GetReplyEditableStatus(GetUserName(user), v.Author, v.CreatedTime)
	}

	var resultReplies []*ReplyWithAvatar

	if enableNestedReply {
		replies = bulidReplies(replies)
		// Use limit to calculate offset
		// If limit is 2, but the first reply have 2 child replies(3 replies)
		// We need put these replies to offset, so cannot use (page * limit) to calculate offset
		pageLimit := limit
		for index, reply := range replies {
			replyLen := getReplyLen(reply)
			// Ignore replies until page == 1
			if page > 1 {
				// Calculate limit in every ignore page
				pageLimit -= replyLen
				// Get replices for init == true(get the latest replies)
				resultReplies = append(resultReplies, reply)
				if pageLimit <= 0 {
					page--
					pageLimit = limit
					if index+1 < len(replies) {
						// If the page is a usable value when we get the latest replies, clear the result
						resultReplies = nil
					}
				}
			} else if limit > 0 {
				// if page == 1, prove that we are processing current page now
				// So we can only calculate the limit and put replies to result slice
				limit -= replyLen
				resultReplies = append(resultReplies, reply)
				page--
			} else {
				// if page == 1, and limit < 0, prove that we get all replies in this page now
				break
			}
		}

		if page > 0 {
			realPage -= page
		}
	} else {
		offset := page*limit - limit
		for _, reply := range replies {
			if offset > 0 {
				offset--
			} else {
				if limit > 0 {
					resultReplies = append(resultReplies, reply)
				} else {
					break
				}
			}
		}
	}

	return resultReplies, realPage
}

func makeReplyTree(replies []*ReplyWithAvatar, reply *ReplyWithAvatar) bool {
	if len(replies) == 0 {
		return false
	}
	for _, r := range replies {
		if r.Id == reply.ParentId {
			r.Child = append(r.Child, reply)
			return true
		} else {
			if makeReplyTree(r.Child, reply) {
				return true
			}
		}
	}
	return false
}

func getReplyLen(reply *ReplyWithAvatar) int {
	replyLen := 1
	for _, child := range reply.Child {
		replyLen += getReplyLen(child)
	}
	return replyLen
}

func bulidReplies(replies []*ReplyWithAvatar) []*ReplyWithAvatar {
	var childReplies []*ReplyWithAvatar
	var repliesResult []*ReplyWithAvatar
	for _, reply := range replies {
		if reply.ParentId != 0 {
			childReplies = append(childReplies, reply)
		} else {
			repliesResult = append(repliesResult, reply)
		}
		if reply.Deleted {
			reply.Content = ""
		}
	}
	replies = repliesResult

	for _, child := range childReplies {
		makeReplyTree(replies, child)
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

// GetReplyByContentAndAuthor returns reply by content and author.
func GetReplyByContentAndAuthor(content string, author string) []*Reply {
	var ret []*Reply
	err := adapter.Engine.Where("content = ?", content).And("author = ?", author).Find(&ret)
	if err != nil {
		panic(err)
	}
	return ret
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
func GetReplyWithDetails(user *casdoorsdk.User, id int) *ReplyWithAvatar {
	reply := ReplyWithAvatar{}
	existed, err := adapter.Engine.Table("reply").
		Join("LEFT OUTER", "consumption_record", "consumption_record.object_id = reply.id and consumption_record.consumption_type = ?", 5).
		Id(id).Cols("reply.*, consumption_record.amount").Get(&reply)
	if err != nil {
		panic(err)
	}

	reply.Avatar = getUserAvatar(reply.Author)

	isAdmin := CheckIsAdmin(user)
	if existed {
		reply.ThanksStatus = reply.ConsumptionAmount != 0
		reply.Deletable = isAdmin || ReplyDeletable(reply.CreatedTime, GetUserName(user), reply.Author)
		reply.Editable = isAdmin || GetReplyEditableStatus(GetUserName(user), reply.Author, reply.CreatedTime)
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

	// return affected != 0
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

	// return affected != 0
	return true
}

// AddReply returns add reply result and reply id.
func AddReply(reply *Reply) (bool, int) {
	// reply.Content = strings.ReplaceAll(reply.Content, "\n", "<br/>")
	reply.Content = FilterUnsafeHTML(reply.Content)
	affected, err := adapter.Engine.Insert(reply)
	if err != nil {
		panic(err)
	}

	return affected != 0, reply.Id
}

func AddReplies(replies []*Reply) bool {
	affected, err := adapter.Engine.Insert(replies)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddRepliesInBatch(relies []*Reply) bool {
	batchSize := 1000

	if len(relies) == 0 {
		return false
	}

	affected := false
	for i := 0; i < (len(relies)-1)/batchSize+1; i++ {
		start := i * batchSize
		end := (i + 1) * batchSize
		if end > len(relies) {
			end = len(relies)
		}

		tmp := relies[start:end]
		fmt.Printf("Add relies: [%d - %d].\n", start, end)
		if AddReplies(tmp) {
			affected = true
		}
	}

	return affected
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
		Cols("reply.content, reply.author, reply.created_time, topic.id, topic.node_id, topic.node_name, topic.title, topic.author").
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
func GetReplyAuthor(id int) *casdoorsdk.User {
	reply := Reply{Id: id}
	existed, err := adapter.Engine.Cols("author").Get(&reply)
	if err != nil {
		panic(err)
	}

	if !existed {
		return nil
	}

	return GetUser(reply.Author)
}

// AddReplyThanksNum updates reply's thanks num.
func AddReplyThanksNum(id int) bool {
	affected, err := adapter.Engine.ID(id).Incr("thanks_num", 1).Update(Reply{})
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
