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
	"strings"
	"time"

	"github.com/casbin/casnode/util"
	"github.com/gomarkdown/markdown"
)

type Topic struct {
	Id              int      `xorm:"int notnull pk autoincr" json:"id"`
	Author          string   `xorm:"varchar(100) index" json:"author"`
	NodeId          string   `xorm:"varchar(100) index" json:"nodeId"`
	NodeName        string   `xorm:"varchar(100)" json:"nodeName"`
	Title           string   `xorm:"varchar(100)" json:"title"`
	CreatedTime     string   `xorm:"varchar(40)" json:"createdTime"`
	Tags            []string `xorm:"varchar(200)" json:"tags"`
	LastReplyUser   string   `xorm:"varchar(100)" json:"lastReplyUser"`
	LastReplyTime   string   `xorm:"varchar(40)" json:"lastReplyTime"`
	ReplyCount      int      `json:"replyCount"`
	UpCount         int      `json:"upCount"`
	HitCount        int      `json:"hitCount"`
	Hot             int      `json:"hot"`
	FavoriteCount   int      `json:"favoriteCount"`
	HomePageTopTime string   `xorm:"varchar(40)" json:"homePageTopTime"`
	TabTopTime      string   `xorm:"varchar(40)" json:"tabTopTime"`
	NodeTopTime     string   `xorm:"varchar(40)" json:"nodeTopTime"`
	Deleted         bool     `xorm:"bool" json:"-"`
	EditorType      string   `xorm:"varchar(40)" json:"editorType"`
	Content         string   `xorm:"mediumtext" json:"content"`
}

func GetTopicCount() int {
	count, err := adapter.Engine.Count(&Topic{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetTopicNum() int {
	count, err := adapter.Engine.Where("deleted = ?", 0).Count(&Topic{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetCreatedTopicsNum(memberId string) int {
	topic := new(Topic)
	total, err := adapter.Engine.Where("author = ?", memberId).And("deleted = ?", 0).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetTopics(limit int, offset int) []*TopicWithAvatar {
	var topics []*Topic
	err := adapter.Engine.Table("topic").
		Where("deleted = ?", 0).
		Desc("home_page_top_time").
		Desc("last_reply_time").
		Desc("created_time").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()

	var ret []*TopicWithAvatar
	for _, topic := range topics {
		ret = append(ret, &TopicWithAvatar{
			Topic: *topic,
			Avatar: memberAvatar[topic.Author],
		})
	}

	return ret
}

func GetTopicsByTitleAndAuthor(title string, author string) []*Topic {
	topics := []*Topic{}
	err := adapter.Engine.Where("title = ?", title).And("author = ?", author).Find(&topics)
	if err != nil {
		panic(err)
	}

	return topics
}

// GetTopicsAdmin *sort: 1 means Asc, 2 means Desc, 0 means no effect.
func GetTopicsAdmin(usernameSearchKw, titleSearchKw, contentSearchKw, showDeletedTopic, createdTimeSort, lastReplySort, usernameSort, replyCountSort, hotSort, favCountSort string, limit int, offset int) ([]*AdminTopicInfo, int) {
	topics := []*Topic{}
	db := adapter.Engine.Table("topic")

	// created time sort
	switch createdTimeSort {
	case "1":
		db = db.Asc("created_time")
	case "2":
		db = db.Desc("created_time")
	}

	// last reply time sort
	switch lastReplySort {
	case "1":
		db = db.Asc("last_reply_time")
	case "2":
		db = db.Desc("last_reply_time")
	}

	// author sort
	switch usernameSort {
	case "1":
		db = db.Asc("author")
	case "2":
		db = db.Desc("author")
	}

	// reply count sort
	switch replyCountSort {
	case "1":
		db = db.Asc("reply_count")
	case "2":
		db = db.Desc("reply_count")
	}

	// hot sort
	switch hotSort {
	case "1":
		db = db.Asc("hot")
	case "2":
		db = db.Desc("hot")
	}

	// favorite count sort
	switch favCountSort {
	case "1":
		db = db.Asc("favorite_count")
	case "2":
		db = db.Desc("favorite_count")
	}

	if usernameSearchKw != "" {
		unKw := util.SplitWords(usernameSearchKw)
		for _, v := range unKw {
			db.Or("author like ?", "%"+v+"%")
		}
	}

	if titleSearchKw != "" {
		tiKw := util.SplitWords(titleSearchKw)
		for _, v := range tiKw {
			db.Or("title like ?", "%"+v+"%")
		}
	}

	if contentSearchKw != "" {
		coKw := util.SplitWords(contentSearchKw)
		for _, v := range coKw {
			db.Or("content like ?", "%"+v+"%")
		}
	}

	if showDeletedTopic == "0" {
		db = db.Where("deleted = ?", 0)
	}

	num, err := db.Limit(limit, offset).FindAndCount(&topics, &Topic{})
	if err != nil {
		panic(err)
	}

	res := []*AdminTopicInfo{}
	for _, v := range topics {
		temp := AdminTopicInfo{
			Topic:   *v,
			Deleted: v.Deleted,
		}
		res = append(res, &temp)
	}

	return res, int(num)
}

func GetTopicWithAvatar(id int, memberId string) *TopicWithAvatar {
	topic := TopicWithAvatar{}
	_, err := adapter.Engine.Table("topic").Id(id).Cols("topic.*").Get(&topic)
	if err != nil {
		panic(err)
	}

	member := GetMember(topic.Author)
	if member != nil {
		topic.Avatar = member.Avatar
	}

	topic.ThanksStatus = GetThanksStatus(memberId, id, 4)
	topic.Editable = GetTopicEditableStatus(memberId, topic.Author, topic.NodeId, topic.CreatedTime)

	return &topic
}

func GetTopic(id int) *Topic {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return &topic
	} else {
		return nil
	}
}

func GetTopicBasicInfo(id int) *Topic {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Id(id).Omit("content").Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return &topic
	} else {
		return nil
	}
}

func GetTopicAdmin(id int) *AdminTopicInfo {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return &AdminTopicInfo{
			Topic:   topic,
			Deleted: topic.Deleted,
		}
	} else {
		return nil
	}
}

func GetTopicTitle(id int) string {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Cols("title").Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return topic.Title
	} else {
		return ""
	}
}

func GetTopicAuthor(id int) string {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Cols("author").Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return topic.Author
	} else {
		return ""
	}
}

func GetTopicNodeId(id int) string {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Cols("node_id").Get(&topic)
	if err != nil {
		panic(err)
	}

	if existed {
		return topic.NodeId
	} else {
		return ""
	}
}

func GetTopicsWithNode(nodeId string, limit int, offset int) []*NodeTopic {
	topics := []*NodeTopic{}
	err := adapter.Engine.Table("topic").
		Where("topic.node_id = ?", nodeId).And("topic.deleted = ?", 0).
		Desc("topic.node_top_time").Desc("topic.last_reply_time").Desc("topic.created_time").
		Cols("topic.*").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()
	for _, t := range topics {
		t.Avatar = memberAvatar[t.Author]
	}

	for _, v := range topics {
		v.ContentLength = len(v.Content)
		v.Content = ""
	}

	return topics
}

func GetTopicsWithTag(tagId string, limit int, offset int) []*NodeTopic {
	topics := []*NodeTopic{}
	tag := fmt.Sprintf("%%%q%%", tagId)
	err := adapter.Engine.Table("topic").
		Where("topic.tags LIKE ?", tag).And("topic.deleted = ?", 0).
		Desc("topic.node_top_time").Desc("topic.last_reply_time").Desc("topic.created_time").
		Cols("topic.*").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()
	for _, t := range topics {
		t.Avatar = memberAvatar[t.Author]
	}

	for _, v := range topics {
		v.ContentLength = len(v.Content)
		v.Content = ""
	}

	return topics
}

func UpdateTopic(id int, topic *Topic) bool {
	if GetTopic(id) == nil {
		return false
	}
	topic.Content = FilterUnsafeHTML(topic.Content)
	_, err := adapter.Engine.Id(id).AllCols().Update(topic)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func UpdateTopicWithLimitCols(id int, topic *Topic) bool {
	if GetTopic(id) == nil {
		return false
	}
	topic.Content = FilterUnsafeHTML(topic.Content)
	_, err := adapter.Engine.Id(id).Update(topic)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

// AddTopic return add topic result and topic id
func AddTopic(topic *Topic) (bool, int) {
	topic.Content = FilterUnsafeHTML(topic.Content)
	affected, err := adapter.Engine.Insert(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0, topic.Id
}

func DeleteTopicHard(id int) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteTopic(id int) bool {
	topic := new(Topic)
	topic.Deleted = true
	affected, err := adapter.Engine.Id(id).Cols("deleted").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

/*
func GetTopicId() int {
	topic := new(Topic)
	_, err := adapter.Engine.Desc("created_time").Omit("content").Limit(1).Get(topic)
	if err != nil {
		panic(err)
	}

	res := util.ParseInt(topic.Id) + 1

	return res
}
*/

func GetAllCreatedTopics(author string, tab string, limit int, offset int) []*Topic {
	topics := []*Topic{}
	err := adapter.Engine.Desc("created_time").Where("author = ?", author).And("deleted = ?", 0).Omit("content").Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	return topics
}

func AddTopicHitCount(topicId int) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.HitCount++
	affected, err := adapter.Engine.Id(topicId).Cols("hit_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicFavoriteCount(topicId int, num int) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.FavoriteCount += num
	affected, err := adapter.Engine.Id(topicId).Cols("favorite_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicReplyCount(topicId int, num int) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.ReplyCount += num
	affected, err := adapter.Engine.Id(topicId).Cols("reply_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicLastReplyUser(topicId int, memberId string, updateTime string) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.LastReplyUser = memberId
	topic.LastReplyTime = updateTime
	if len(memberId) == 0 {
		topic.LastReplyTime = ""
	}
	affected, err := adapter.Engine.Id(topicId).Cols("last_reply_user, last_reply_time").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetTopicsWithTab(tab string, limit, offset int) []*TopicWithAvatar {
	topics := []*TopicWithAvatar{}

	if tab == "all" {
		topics = GetTopics(limit, offset)
	} else {
		err := adapter.Engine.Table("topic").Join("INNER", "node", "node.id = topic.node_id").
			Where("node.tab_id = ?", tab).And("topic.deleted = ?", 0).
			Desc("topic.tab_top_time").Desc("topic.last_reply_time").
			Cols("topic.id, topic.author, topic.node_id, topic.node_name, topic.title, topic.created_time, topic.last_reply_user, topic.last_Reply_time, topic.reply_count, topic.favorite_count, topic.deleted, topic.home_page_top_time, topic.tab_top_time, topic.node_top_time").
			Limit(limit, offset).Find(&topics)

		if err != nil {
			panic(err)
		}
	}

	memberAvatar := GetMemberAvatarMapping()
	for _, t := range topics {
		t.Avatar = memberAvatar[t.Author]
	}

	return topics
}

func UpdateTopicHotInfo(topicId string, hot int) bool {
	topic := new(Topic)

	topic.Hot = hot
	affected, err := adapter.Engine.Id(topicId).Cols("hot").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetHotTopic(limit int) []*TopicWithAvatar {
	var topics []*Topic
	err := adapter.Engine.Table("topic").
		Desc("hot").And("deleted = ? ", 0).Limit(limit).Find(&topics)
	if err != nil {
		panic(err)
	}

	var ret []*TopicWithAvatar
	memberAvatar := GetMemberAvatarMapping()
	for _, t := range topics {
		ret = append(ret, &TopicWithAvatar{
			Topic: *t,
			Avatar: memberAvatar[t.Author],
		})
	}

	return ret
}

func GetTopicEditableStatus(member, author, nodeId, createdTime string) bool {
	if CheckModIdentity(member) || CheckNodeModerator(member, nodeId) {
		return true
	}
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
	if now.Sub(t).Minutes() > TopicEditableTime {
		return false
	}

	return true
}

// ChangeTopicTopExpiredTime changes topic's top expired time.
// topType: tab, node or homePage.
func ChangeTopicTopExpiredTime(id int, date, topType string) bool {
	topic := GetTopic(id)
	if topic == nil {
		return false
	}

	switch topType {
	case "tab":
		topic.TabTopTime = date
	case "node":
		topic.NodeTopTime = date
	case "homePage":
		topic.HomePageTopTime = date
	}

	affected, err := adapter.Engine.Id(id).Cols("tab_top_time, node_top_time, home_page_top_time").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// ExpireTopTopic searches and expires expired top topic.
func ExpireTopTopic() int {
	topics := []*Topic{}
	err := adapter.Engine.Where("tab_top_time != ?", "").Or("node_top_time != ?", "").Or("home_page_top_time != ?", "").Cols("id, tab_top_time, node_top_time, home_page_top_time").Find(&topics)
	if err != nil {
		panic(err)
	}

	var num int
	date := util.GetCurrentTime()
	for _, v := range topics {
		if v.TabTopTime <= date {
			res := ChangeTopicTopExpiredTime(v.Id, "", "tab")
			if res {
				num++
			}
		}
		if v.NodeTopTime <= date {
			res := ChangeTopicTopExpiredTime(v.Id, "", "node")
			if res {
				num++
			}
		}
		if v.HomePageTopTime <= date {
			res := ChangeTopicTopExpiredTime(v.Id, "", "homePage")
			if res {
				num++
			}
		}
	}

	return num
}

func (t Topic) GetAllRepliesOfTopic() []string {
	var ret []string
	var replies []Reply
	err := adapter.Engine.Where("topic_id = ? and deleted = 0", t.Id).Find(&replies)
	if err != nil {
		panic(err)
	}
	var content string
	for _, reply := range replies {
		if reply.EditorType == "markdown" {
			content = string(markdown.ToHTML([]byte(reply.Content), nil, nil))
		} else {
			content = reply.Content
		}
		ret = append(ret, content)
	}
	return ret
}

func SearchTopics(keyword string) []TopicWithAvatar {
	var topics []Topic
	sqlKeyword := fmt.Sprintf("%%%s%%", keyword)

	err := adapter.Engine.Where("deleted = 0").Where("title like ? or content like ?", sqlKeyword, sqlKeyword).Find(&topics)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()
	var ret []TopicWithAvatar
	for _, topic := range topics {
		content := RemoveHtmlTags(topic.Content)
		if !strings.Contains(content, keyword) && !strings.Contains(topic.Title, keyword) {
			continue
		}

		ret = append(ret, TopicWithAvatar{
			Topic: topic,
			Avatar: memberAvatar[topic.Author],
		})
	}

	return ret
}
