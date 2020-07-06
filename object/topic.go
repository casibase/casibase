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

import "strings"

type Topic struct {
	Id            string   `xorm:"varchar(100) notnull pk" json:"id"`
	Author        string   `xorm:"varchar(100)" json:"author"`
	NodeId        string   `xorm:"varchar(100)" json:"nodeId"`
	NodeName      string   `xorm:"varchar(100)" json:"nodeName"`
	Title         string   `xorm:"varchar(100)" json:"title"`
	CreatedTime   string   `xorm:"varchar(100)" json:"createdTime"`
	Tags          []string `xorm:"varchar(200)" json:"tags"`
	LastReplyUser string   `xorm:"varchar(100)" json:"lastReplyUser"`
	ReplyCount    int      `json:"replyCount"`
	UpCount       int      `json:"upCount"`
	HitCount      int      `json:"hitCount"`
	FavoriteCount int      `json:"favoriteCount"`

	Content string `xorm:"mediumtext" json:"content"`
}

func GetTopicCount() int {
	count, err := adapter.engine.Count(&Topic{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetCreatedTopicsNum(memberId string) int {
	topic := new(Topic)
	total, err := adapter.engine.Where("author = ?", memberId).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetTopics(limit int, offset int) []*TopicWithAvatar {
	topics := []*Topic{}
	err := adapter.engine.Desc("created_time").Omit("content").Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	res := []*TopicWithAvatar{}
	for _, v := range topics {
		temp := TopicWithAvatar{
			Topic:  *v,
			Avatar: GetMemberAvatar(v.Author),
		}
		res = append(res, &temp)
	}

	return res
}

func GetTopic(id string) *TopicWithAvatar {
	topic := Topic{Id: id}
	existed, err := adapter.engine.Get(&topic)
	if err != nil {
		panic(err)
	}

	res := TopicWithAvatar{
		Topic:  topic,
		Avatar: GetMemberAvatar(topic.Author),
	}

	if existed {
		return &res
	} else {
		return nil
	}
}

func GetTopicsWithNode(nodeId string, limit int, offset int) []*TopicWithAvatar {
	topics := []*Topic{}
	err := adapter.engine.Desc("created_time").Where("node_id = ?", nodeId).Omit("content").Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	res := []*TopicWithAvatar{}
	for _, v := range topics {
		temp := TopicWithAvatar{
			Topic:  *v,
			Avatar: GetMemberAvatar(v.Author),
		}
		res = append(res, &temp)
	}

	return res
}

func UpdateTopic(id string, topic *Topic) bool {
	if GetTopic(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).AllCols().Update(topic)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func AddTopic(topic *Topic) bool {
	topic.Content = strings.ReplaceAll(topic.Content, "\n", "<br/>")

	affected, err := adapter.engine.Insert(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteTopic(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Topic{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetAllCreatedTopics(author string, tab string, limit int, offset int) []*Topic {
	topics := []*Topic{}
	err := adapter.engine.Desc("created_time").Where("author = ?", author).Omit("content").Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	return topics
}

func AddTopicHitCount(topicId string) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.HitCount++
	affected, err := adapter.engine.Id(topicId).Cols("hit_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicFavoriteCount(topicId string, num int) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.FavoriteCount += num
	affected, err := adapter.engine.Id(topicId).Cols("favorite_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicReplyCount(topicId string, num int) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.ReplyCount += num
	affected, err := adapter.engine.Id(topicId).Cols("reply_count").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ChangeTopicLastReplyUser(topicId string, memberId string) bool {
	topic := GetTopic(topicId)
	if topic == nil {
		return false
	}

	topic.LastReplyUser = memberId
	affected, err := adapter.engine.Id(topicId).Cols("last_reply_user").Update(topic)
	if err != nil {
		panic(err)
	}

	return affected != 0
}
