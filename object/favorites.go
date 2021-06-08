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

import "github.com/casbin/casnode/util"

// Favorites using figure 1-3 to choose type, 1 means topic, 2 means people, 3 means node.
type Favorites struct {
	Id            int    `xorm:"int notnull pk autoincr" json:"id"`
	FavoritesType int    `xorm:"int index" json:"favoritesType"`
	ObjectId      string `xorm:"varchar(100) index" json:"objectId"`
	CreatedTime   string `xorm:"varchar(40)" json:"createdTime"`
	MemberId      string `xorm:"varchar(100) index" json:"memberId"`
}

func AddFavorites(favorite *Favorites) bool {
	affected, err := adapter.Engine.Insert(favorite)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteFavorites(memberId string, objectId string, favoritesType int) bool {
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

func GetFavoritesStatus(memberId string, objectId string, favoritesType int) bool {
	node := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", favoritesType).And("object_id = ?", objectId).And("member_id = ?", memberId).Count(node)
	if err != nil {
		panic(err)
	}

	return total != 0
}

func GetTopicsFromFavorites(memberId string, limit int, offset int) []*TopicWithAvatar {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("member_id = ?", memberId).And("favorites_type = ?", 1).Limit(limit, offset).Find(&favorites)
	if err != nil {
		panic(err)
	}

	topics := []*TopicWithAvatar{}
	for _, v := range favorites {
		topicId := util.ParseInt(v.ObjectId)
		temp := GetTopicWithAvatar(topicId, "")
		topics = append(topics, temp)
	}

	return topics
}

func GetFollowingNewAction(memberId string, limit int, offset int) []*TopicWithAvatar {
	var topics []*TopicWithAvatar

	err := adapter.Engine.Table("topic").
		Join("INNER", "favorites", "favorites.object_id = topic.author").
		Where("favorites.member_id = ?", memberId).And("favorites.favorites_type = ?", 2).
		Desc("topic.id").
		Cols("topic.id, topic.author, topic.node_id, topic.node_name, topic.title, topic.created_time, topic.last_reply_user, topic.last_Reply_time, topic.reply_count, topic.favorite_count, topic.deleted, topic.home_page_top_time, topic.tab_top_time, topic.node_top_time").
		Omit("topic.content").
		Limit(limit, offset).Find(&topics)
	if err != nil {
		panic(err)
	}

	memberAvatar := GetMemberAvatarMapping()

	for _, topic := range topics {
		topic.Avatar = memberAvatar[topic.Author]
	}

	return topics
}

func GetNodesFromFavorites(memberId string, limit int, offset int) []*NodeFavoritesRes {
	favorites := []*Favorites{}
	err := adapter.Engine.Where("member_id = ?", memberId).And("favorites_type = ?", 3).Limit(limit, offset).Find(&favorites)
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
	total, err := adapter.Engine.Where("favorites_type = ?", 3).And("object_id = ?", id).Count(node)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetFollowingNum(id string) int {
	member := new(Favorites)
	total, err := adapter.Engine.Where("favorites_type = ?", 2).And("member_id = ?", id).Count(member)
	if err != nil {
		panic(err)
	}

	return int(total)
}

func GetFavoritesNum(favoritesType int, memberId string) int {
	var total int64
	var err error

	switch favoritesType {
	case 1:
		topic := new(Favorites)
		total, err = adapter.Engine.Where("favorites_type = ?", 1).And("member_id = ?", memberId).Count(topic)
		if err != nil {
			panic(err)
		}
		break
	case 2:
		topic := new(Favorites)
		total, err = adapter.Engine.Table("topic").Join("INNER", "favorites", "topic.author = favorites.object_id").Where("favorites.member_id = ?", memberId).And("favorites.favorites_type = ?", 2).Count(topic)
		if err != nil {
			panic(err)
		}
		break
	case 3:
		node := new(Favorites)
		total, err = adapter.Engine.Where("favorites_type = ?", 3).And("member_id = ?", memberId).Count(node)
		if err != nil {
			panic(err)
		}
		break
	default:
		return 0
	}

	return int(total)
}
