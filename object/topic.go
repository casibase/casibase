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
	"sync"
	"time"

	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/gomarkdown/markdown"
)

type Topic struct {
	Id              int      `xorm:"int notnull pk autoincr" json:"id"`
	Author          string   `xorm:"varchar(100) index" json:"author"`
	NodeId          string   `xorm:"varchar(100) index" json:"nodeId"`
	NodeName        string   `xorm:"varchar(100)" json:"nodeName"`
	TabId           string   `xorm:"varchar(100) index" json:"tabId"`
	Title           string   `xorm:"varchar(300) index" json:"title"`
	CreatedTime     string   `xorm:"varchar(40)" json:"createdTime"`
	Tags            []string `xorm:"varchar(200)" json:"tags"`
	ReplyCount      int      `json:"replyCount"`
	UpCount         int      `json:"upCount"`
	DownCount       int      `json:"downCount"`
	HitCount        int      `json:"hitCount"`
	Hot             int      `xorm:"index" json:"hot"`
	FavoriteCount   int      `json:"favoriteCount"`
	SubscribeCount  int      `json:"subscribeCount"`
	HomePageTopTime string   `xorm:"varchar(40) index(IDX_topic_htt_lrt)" json:"homePageTopTime"`
	TabTopTime      string   `xorm:"varchar(40) index(IDX_topic_ttt_lrt)" json:"tabTopTime"`
	NodeTopTime     string   `xorm:"varchar(40) index(IDX_topic_ntt_lrt)" json:"nodeTopTime"`
	LastReplyUser   string   `xorm:"varchar(100)" json:"lastReplyUser"`
	LastReplyTime   string   `xorm:"varchar(40) index(IDX_topic_htt_lrt) index(IDX_topic_ttt_lrt) index(IDX_topic_ntt_lrt)" json:"lastReplyTime"`
	Deleted         bool     `xorm:"bool index" json:"-"`
	EditorType      string   `xorm:"varchar(40)" json:"editorType"`
	Content         string   `xorm:"mediumtext" json:"content"`
	UrlPath         string   `xorm:"varchar(100)" json:"urlPath"`
	IsHidden        bool     `xorm:"bool index" json:"isHidden"`
	Ip              string   `xorm:"varchar(100)" json:"ip"`
	State           string   `xorm:"varchar(100)" json:"state"`
	GitterMessageId string   `xorm:"varchar(100)" json:"gitterMessageId"`
}

func GetTopicCount() int {
	count, err := adapter.Engine.Count(&Topic{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetTopicNum() int {
	count, err := adapter.Engine.Where("deleted = ? and is_hidden = ?", 0, 0).Count(&Topic{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetCreatedTopicsNum(memberId string) int {
	topic := new(Topic)
	total, err := adapter.Engine.Where("author = ? and deleted = ? and is_hidden = ?", memberId, 0, 0).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func getAvataredTopics(topics []*Topic) []*TopicWithAvatar {
	res := []*TopicWithAvatar{}
	for _, topic := range topics {
		topicWithAvatar := &TopicWithAvatar{
			Topic:  *topic,
			Avatar: getUserAvatar(topic.Author),
		}
		res = append(res, topicWithAvatar)
	}
	return res
}

func GetTopics(limit int, offset int) []*TopicWithAvatar {
	var topics []*Topic
	err := adapter.Engine.Table("topic").
		Where("deleted = ?", 0).And("is_hidden = ?", 0).
		Desc("home_page_top_time", "last_reply_time").
		Cols("id, author, node_id, node_name, title, created_time, last_reply_user, last_Reply_time, reply_count, favorite_count, deleted, home_page_top_time, tab_top_time, node_top_time").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	return getAvataredTopics(topics)
}

func GetAllTopics() []*Topic {
	var topics []*Topic
	err := adapter.Engine.Find(&topics)
	if err != nil {
		panic(err)
	}

	return topics
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

func GetTopicWithAvatar(id int, user *casdoorsdk.User) *TopicWithAvatar {
	topic := TopicWithAvatar{}

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		topicObj := GetTopic(id)
		if topicObj != nil {
			topic.Topic = *topicObj

			topic.Avatar = getUserAvatar(topic.Author)

			topic.Editable = GetTopicEditableStatus(user, topic.Author, topic.NodeId, topic.CreatedTime)
		}
	}()
	go func() {
		defer wg.Done()
		name := ""
		if user != nil {
			name = GetUserName(user)
		}

		topic.ThanksStatus = GetThanksStatus(name, id, 4)
	}()

	wg.Wait()

	if topic.Author == "" {
		return nil
	}
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

func GetTopicByUrlPathAndTitle(urlPath, title, nodeId string) *Topic {
	topic := Topic{UrlPath: urlPath, Title: title, NodeId: nodeId}
	existed, err := adapter.Engine.Get(&topic)
	if err != nil {
		panic(err)
	}

	if !existed {
		return nil
	}

	return &topic
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

func GetTopicAuthor(id int) *casdoorsdk.User {
	topic := Topic{Id: id}
	existed, err := adapter.Engine.Cols("author").Get(&topic)
	if err != nil {
		panic(err)
	}

	if !existed {
		return nil
	}

	return GetUser(topic.Author)
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

func GetTopicsByNode(nodeId string, limit int, offset int) []*NodeTopic {
	topics := []*NodeTopic{}
	err := adapter.Engine.Table("topic").
		Where("node_id = ?", nodeId).And("deleted = ?", 0).
		Desc("node_top_time", "last_reply_time").
		Cols("id, author, node_id, node_name, title, created_time, last_reply_user, last_Reply_time, reply_count, favorite_count, deleted, home_page_top_time, tab_top_time, node_top_time").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	for _, topic := range topics {
		topic.Avatar = getUserAvatar(topic.Author)

		topic.ContentLength = len(topic.Content)
		topic.Content = ""
	}

	return topics
}

func GetTopicsByTag(tagId string, limit int, offset int) []*NodeTopic {
	topics := []*NodeTopic{}
	tag := fmt.Sprintf("%%%q%%", tagId)
	err := adapter.Engine.Table("topic").
		Where("deleted = ?", 0).And("tags LIKE ?", tag).
		Desc("node_top_time", "last_reply_time").
		Cols("id, author, node_id, node_name, title, created_time, last_reply_user, last_Reply_time, reply_count, favorite_count, deleted, home_page_top_time, tab_top_time, node_top_time").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	for _, topic := range topics {
		topic.Avatar = getUserAvatar(topic.Author)

		topic.ContentLength = len(topic.Content)
		topic.Content = ""
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

	// return affected != 0
	return true
}

func updateTopicSimple(id int, topic *Topic) bool {
	affected, err := adapter.Engine.Id(id).AllCols().Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
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

	// return affected != 0
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

func AddTopics(topics []*Topic) bool {
	affected, err := adapter.Engine.Insert(topics)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddTopicsInBatch(topics []*Topic) bool {
	batchSize := 1000

	if len(topics) == 0 {
		return false
	}

	affected := false
	for i := 0; i < (len(topics)-1)/batchSize+1; i++ {
		start := i * batchSize
		end := (i + 1) * batchSize
		if end > len(topics) {
			end = len(topics)
		}

		tmp := topics[start:end]
		fmt.Printf("Add topics: [%d - %d].\n", start, end)
		if AddTopics(tmp) {
			affected = true
		}
	}

	return affected
}

func DeleteTopicHard(id int) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteTopic(id int) bool {
	t := GetTopic(id)
	if strings.HasPrefix(t.Content, "URL: ") {
		return DeleteTopicHard(id)
	}

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
	affected, err := adapter.Engine.ID(topicId).Incr("hit_count", 1).Update(Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicFavoriteCount(topicId int, num int) bool {
	affected, err := adapter.Engine.ID(topicId).Incr("favorite_count", num).Update(Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicSubscribeCount(topicId int, num int) bool {
	affected, err := adapter.Engine.ID(topicId).Incr("subscribe_count", num).Update(Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicReplyCount(topicId int, num int) bool {
	affected, err := adapter.Engine.ID(topicId).Incr("reply_count", num).Update(Topic{})
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
	if tab == "all" {
		topics := GetTopics(limit, offset)
		return topics
	} else {
		topics := []*Topic{}
		err := adapter.Engine.Table("topic").
			Where("tab_id = ?", tab).And("deleted = ?", 0).And("is_hidden = ?", 0).
			Desc("tab_top_time", "last_reply_time").
			Cols("id, author, node_id, node_name, title, created_time, last_reply_user, last_Reply_time, reply_count, favorite_count, deleted, home_page_top_time, tab_top_time, node_top_time").
			Limit(limit, offset).Find(&topics)
		if err != nil {
			panic(err)
		}

		return getAvataredTopics(topics)
	}
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
		Where("deleted = ? ", 0).
		Desc("hot").
		Cols("id, author, node_id, node_name, title, created_time, last_reply_user, last_Reply_time, reply_count, favorite_count, deleted, home_page_top_time, tab_top_time, node_top_time").
		Limit(limit).Find(&topics)
	if err != nil {
		panic(err)
	}

	return getAvataredTopics(topics)
}

// GetSortedTopics *sort: 1 means Asc, 2 means Desc, 0 means no effect.
func GetSortedTopics(lastReplySort, hotSort, favCountSort, createdTimeSort string, limit int, offset int) []*TopicWithAvatar {
	var topics []*Topic
	db := adapter.Engine.Table("topic")
	// last reply time sort
	switch lastReplySort {
	case "1":
		db = db.Asc("last_reply_time")
	case "2":
		db = db.Desc("last_reply_time")
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

	// created time sort
	switch createdTimeSort {
	case "1":
		db = db.Desc("created_time")
	case "2":
		db = db.Desc("created_time")
	}

	err := db.
		Where("deleted = ? and is_hidden <> ?", 0, 1).
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	return getAvataredTopics(topics)
}

func GetTopicEditableStatus(user *casdoorsdk.User, author, nodeId, createdTime string) bool {
	if CheckIsAdmin(user) || CheckNodeModerator(user, nodeId) {
		return true
	}

	if GetUserName(user) != author {
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

func SearchTopics(keyword string) []*TopicWithAvatar {
	topics := []*Topic{}
	sqlKeyword := fmt.Sprintf("%%%s%%", keyword)

	err := adapter.Engine.Where("deleted = 0").Where("title like ? or content like ?", sqlKeyword, sqlKeyword).Find(&topics)
	if err != nil {
		panic(err)
	}

	topics2 := []*Topic{}
	for _, topic := range topics {
		content := RemoveHtmlTags(topic.Content)
		if !strings.Contains(content, keyword) && !strings.Contains(topic.Title, keyword) {
			continue
		}

		topics2 = append(topics2, topic)
	}

	return getAvataredTopics(topics2)
}
