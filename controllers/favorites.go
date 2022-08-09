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

package controllers

import (
	"sync"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

// @router /add-favorites [post]
// @Tag Favorite API
// @Title AddFavorites
func (c *ApiController) AddFavorites() {
	objectId := c.Input().Get("id")
	favoritesType := c.Input().Get("type")
	memberId := c.GetSessionUsername()
	var resp Response

	if object.IsFavoritesExist(favoritesType) == false {
		c.ResponseError("Invalid favorites type")
		return
	}

	favoriteStatus := object.GetFavoritesStatus(memberId, objectId, favoritesType)
	if favoriteStatus {
		c.ResponseOk(resp)
		return
	}

	username := c.GetSessionUsername()
	favorites := object.Favorites{
		// Id:            util.IntToString(object.GetFavoritesCount()) + username,
		FavoritesType: favoritesType,
		ObjectId:      objectId,
		CreatedTime:   util.GetCurrentTime(),
		MemberId:      username,
	}

	var wg sync.WaitGroup
	res := true
	if favorites.FavoritesType == object.FavorTopic {
		wg.Add(1)
		go func() {
			topicId := util.ParseInt(favorites.ObjectId)
			res = object.ChangeTopicFavoriteCount(topicId, 1)
			wg.Done()
		}()
	}

	if favorites.FavoritesType == object.SubscribeTopic {
		wg.Add(1)
		go func() {
			topicId := util.ParseInt(favorites.ObjectId)
			res = object.ChangeTopicSubscribeCount(topicId, 1)
			wg.Done()
		}()
	}

	res = object.AddFavorites(&favorites)
	if favoritesType == object.FavorTopic {
		topicId := util.ParseInt(objectId)
		notification := object.Notification{
			// Id:               util.IntToString(object.GetNotificationId()),
			NotificationType: 4,
			ObjectId:         topicId,
			CreatedTime:      util.GetCurrentTime(),
			SenderId:         c.GetSessionUsername(),
			ReceiverId:       object.GetTopicAuthor(topicId).Name,
			Status:           1,
		}
		if notification.ReceiverId != notification.SenderId {
			_ = object.AddNotification(&notification)
		}
	}
	resp = Response{Status: "ok", Msg: "success", Data: res}

	wg.Wait()

	if !res {
		c.ResponseError("add favorite wrong")
		return
	}

	c.ResponseOk(resp)
}

// @router /delete-favorites [post]
// @Tag Favorite API
// @Title DeleteFavorites
func (c *ApiController) DeleteFavorites() {
	memberId := c.GetSessionUsername()
	objectId := c.Input().Get("id")
	favoritesType := c.Input().Get("type")
	var resp Response

	if object.IsFavoritesExist(favoritesType) == false {
		resp = Response{Status: "fail", Msg: "param wrong"}
		c.Data["json"] = resp
		c.ServeJSON()
	}

	var wg sync.WaitGroup
	res := true
	if favoritesType == object.FavorTopic {
		topicId := util.ParseInt(objectId)
		wg.Add(1)
		go func() {
			res = object.ChangeTopicFavoriteCount(topicId, -1)
			wg.Done()
		}()
	}

	if favoritesType == object.SubscribeTopic {
		topicId := util.ParseInt(objectId)
		wg.Add(1)
		go func() {
			res = object.ChangeTopicSubscribeCount(topicId, -1)
			wg.Done()
		}()
	}

	res = object.DeleteFavorites(memberId, objectId, favoritesType)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	wg.Wait()

	if !res {
		resp = Response{Status: "fail", Msg: "delete favorite wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @router /get-favorites-status [get]
// @Tag Favorite API
// @Title GetFavoritesStatus
func (c *ApiController) GetFavoritesStatus() {
	memberId := c.GetSessionUsername()
	objectId := c.Input().Get("id")
	favoritesType := c.Input().Get("type")

	var resp Response
	if object.IsFavoritesExist(favoritesType) {
		res := object.GetFavoritesStatus(memberId, objectId, favoritesType)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @router /get-favorites [get]
// @Tag Favorite API
// @Title GetFavorites
func (c *ApiController) GetFavorites() {
	memberId := c.GetSessionUsername()
	favoritesType := c.Input().Get("type")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultPageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}

	var resp Response
	switch favoritesType {
	case object.FavorTopic:
		res := object.GetTopicsFromFavorites(memberId, limit, offset, object.FavorTopic)
		num := object.GetFavoritesNum(object.FavorTopic, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	case object.FollowUser:
		res := object.GetFollowingNewAction(memberId, limit, offset)
		num := object.GetFavoritesNum(object.FollowUser, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	case object.FavorNode:
		res := object.GetNodesFromFavorites(memberId, limit, offset)
		num := object.GetFavoritesNum(object.FavorNode, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	case object.SubscribeTopic:
		res := object.GetTopicsFromFavorites(memberId, limit, offset, object.SubscribeTopic)
		num := object.GetFavoritesNum(object.SubscribeTopic, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	default:
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @router /get-account-favorite-num [get]
// @Tag Favorite API
// @Title GetAccountFavoriteNum
func (c *ApiController) GetAccountFavoriteNum() {
	memberId := c.GetSessionUsername()

	var res [6]int
	var wg sync.WaitGroup

	// favorite type set,5 object.favorTopic...
	typeSet := []string{object.FavorTopic, object.FollowUser, object.FavorNode, object.SubscribeTopic}

	for i := 1; i <= len(typeSet); i++ {
		wg.Add(1)
		i := i
		go func() {
			if i == 2 {
				res[i] = object.GetFollowingNum(memberId)
			} else {
				res[i] = object.GetFavoritesNum(typeSet[i-1], memberId)
			}
			wg.Done()
		}()
	}
	wg.Wait()

	c.ResponseOk(res)
}
