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
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type Favorites struct {
	Id            int    `xorm:"int notnull pk autoincr" json:"id"`
	FavoritesType string `xorm:"varchar(100) index" json:"favoritesType"`
	ObjectId      string `xorm:"varchar(100) index" json:"objectId"`
	CreatedTime   string `xorm:"varchar(40)" json:"createdTime"`
	MemberId      string `xorm:"varchar(100) index" json:"memberId"`
}

const (
	FavorTopic     = "favor_topic"
	FollowUser     = "follow_user"
	FavorNode      = "favor_node"
	SubscribeTopic = "subscribe_topic"
)

func IsFavoritesExist(Type string) bool {
	// check the if the string is in the enum
	if Type == FavorTopic || Type == FollowUser || Type == FavorNode || Type == SubscribeTopic {
		return true
	}
	return false
}

func AddFavorites(favorite *Favorites) bool {
	affected, err := adapter.Engine.Insert(favorite)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddMemberFavorites(memberId string, favoritesType string, objectId string) bool {
	status := GetFavoritesStatus(memberId, favoritesType, objectId)
	if status == true {
		return true
	}
	favorite := Favorites{
		FavoritesType: favoritesType,
		ObjectId:      objectId,
		CreatedTime:   util.GetCurrentTime(),
		MemberId:      memberId,
	}
	return AddFavorites(&favorite)
}

func DeleteFavorites(memberId string, objectId string, favoritesType string) bool {
	affected, err := adapter.Engine.Where("favorites_type = ?", favoritesType).And("object_id = ?", objectId).And("member_id = ?", memberId).Delete(&Favorites{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetFavoritesCount() int {
	count, err := adapter.Engine.Count(&Favorites{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

func GetFavoritesStatus(memberId string, objectId string, favoritesType string) bool {
	node := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", favoritesType).And("object_id = ?", objectId).And("member_id = ?", memberId).Count(node)
	if err != nil {
		panic(err)
	}

	return total != 0
}

func GetTopicsFromFavorites(memberId string, limit int, offset int, favoritesType string) []*TopicWithAvatar {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("member_id = ?", memberId).And("favorites_type = ?", favoritesType).Limit(limit, offset).Find(&favorites)
	if err != nil {
		panic(err)
	}

	topics := []*TopicWithAvatar{}
	for _, v := range favorites {
		topicId := util.ParseInt(v.ObjectId)
		temp := GetTopicWithAvatar(topicId, nil)
		topics = append(topics, temp)
	}

	return topics
}

func GetMembersFromFavorites(objectId string, favoritesType string) []*casdoorsdk.User {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("object_id = ?", objectId).And("favorites_type = ?", favoritesType).Find(&favorites)
	if err != nil {
		panic(err)
	}

	members := []*casdoorsdk.User{}
	for _, v := range favorites {
		user := GetUser(v.MemberId)
		if user != nil {
			members = append(members, user)
		}
	}

	return members
}

func GetRepliesFromFavorites(memberId string, limit int, offset int, favoritesType string) []*ReplyWithAvatar {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("member_id = ?", memberId).And("favorites_type = ?", favoritesType).Limit(limit, offset).Find(&favorites)
	if err != nil {
		panic(err)
	}

	replies := []*ReplyWithAvatar{}
	for _, v := range favorites {
		topicId := util.ParseInt(v.ObjectId)
		temp, _ := GetReplies(topicId, nil, limit, offset)
		for _, v := range temp {
			replies = append(replies, v)
		}
	}

	return replies
}

func GetFollowingNewAction(memberId string, limit int, offset int) []*TopicWithAvatar {
	var topics []*TopicWithAvatar

	err := adapter.Engine.Table("topic").
		Join("INNER", "favorites", "favorites.object_id = topic.author").
		Where("favorites.member_id = ?", memberId).And("favorites.favorites_type = ?", FollowUser).
		Desc("topic.id").
		Cols("topic.id, topic.author, topic.node_id, topic.node_name, topic.title, topic.created_time, topic.last_reply_user, topic.last_Reply_time, topic.reply_count, topic.favorite_count, topic.deleted, topic.home_page_top_time, topic.tab_top_time, topic.node_top_time").
		Omit("topic.content").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	for _, topic := range topics {
		topic.Avatar = getUserAvatar(topic.Author)
	}

	return topics
}

func GetNodesFromFavorites(memberId string, limit int, offset int) []*NodeFavoritesRes {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("member_id = ?", memberId).And("favorites_type = ?", FavorNode).Limit(limit, offset).Find(&favorites)
	if err != nil {
		panic(err)
	}

	nodes := []*NodeFavoritesRes{}
	for _, v := range favorites {
		var temp NodeFavoritesRes
		temp.NodeInfo = GetNode(v.ObjectId)
		temp.TopicNum = GetNodeTopicNum(v.ObjectId)
		nodes = append(nodes, &temp)
	}

	return nodes
}

func GetNodeFavoritesNum(id string) int {
	node := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", FavorNode).And("object_id = ?", id).Count(node)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetTopicFavoritesNum(id string) int {
	topic := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", FavorTopic).And("object_id = ?", id).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetTopicSubscribeNum(id string) int {
	topic := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", SubscribeTopic).And("object_id = ?", id).Count(topic)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetFollowingNum(id string) int {
	member := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", FollowUser).And("member_id = ?", id).Count(member)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetFavoritesNum(favoritesType string, memberId string) int {
	var total int64
	var err error

	switch favoritesType {
	case FavorTopic:
		topic := new(Favorites)
		total, err = adapter.Engine.Where("favorites_type = ?", FavorTopic).And("member_id = ?", memberId).Count(topic)
		if err != nil {
			panic(err)
		}
		break
	case FollowUser:
		topic := new(Favorites)
		total, err = adapter.Engine.Table("topic").Join("INNER", "favorites", "topic.author = favorites.object_id").Where("favorites.member_id = ?", memberId).And("favorites.favorites_type = ?", FollowUser).Count(topic)
		if err != nil {
			panic(err)
		}
		break
	case FavorNode:
		node := new(Favorites)
		total, err = adapter.Engine.Where("favorites_type = ?", FavorNode).And("member_id = ?", memberId).Count(node)
		if err != nil {
			panic(err)
		}
		break
	case SubscribeTopic:
		topic := new(Favorites)
		total, err = adapter.Engine.Where("favorites_type = ?", SubscribeTopic).And("member_id = ?", memberId).Count(topic)
		if err != nil {
			panic(err)
		}
		break
	default:
		return 0
	}

	return int(total)
}
