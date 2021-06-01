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

func (c *ApiController) AddFavorites() {
	objectId := c.Input().Get("id")
	favoritesTypeStr := c.Input().Get("type")
	favoritesType := util.ParseInt(favoritesTypeStr)

	memberId := c.GetSessionUsername()
	favorites := object.Favorites{
		//Id:            util.IntToString(object.GetFavoritesCount()) + memberId,
		FavoritesType: favoritesType,
		ObjectId:      objectId,
		CreatedTime:   util.GetCurrentTime(),
		MemberId:      memberId,
	}

	var wg sync.WaitGroup
	res := true
	if favorites.FavoritesType == 1 {
		wg.Add(1)
		go func() {
			topicId := util.ParseInt(favorites.ObjectId)
			res = object.ChangeTopicFavoriteCount(topicId, 1)
			wg.Done()
		}()
	}

	var resp Response
	if favoritesType <= 3 && favoritesType >= 1 {
		res := object.AddFavorites(&favorites)
		if favoritesType == 1 {
			topicId := util.ParseInt(objectId)
			notification := object.Notification{
				//Id:               util.IntToString(object.GetNotificationId()),
				NotificationType: 4,
				ObjectId:         topicId,
				CreatedTime:      util.GetCurrentTime(),
				SenderId:         c.GetSessionUsername(),
				ReceiverId:       object.GetTopicAuthor(topicId),
				Status:           1,
			}
			if notification.ReceiverId != notification.SenderId {
				_ = object.AddNotification(&notification)
			}
		}
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	wg.Wait()

	if !res {
		resp = Response{Status: "fail", Msg: "add favorite wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DeleteFavorites() {
	memberId := c.GetSessionUsername()
	objectId := c.Input().Get("id")
	favoritesTypeStr := c.Input().Get("type")
	favoritesType := util.ParseInt(favoritesTypeStr)

	var wg sync.WaitGroup
	res := true
	if favoritesType == 1 {
		topicId := util.ParseInt(objectId)
		wg.Add(1)
		go func() {
			res = object.ChangeTopicFavoriteCount(topicId, -1)
			wg.Done()
		}()
	}

	var resp Response
	if favoritesType <= 3 && favoritesType >= 1 {
		res := object.DeleteFavorites(memberId, objectId, favoritesType)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	wg.Wait()

	if !res {
		resp = Response{Status: "fail", Msg: "delete favorite wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetFavoritesStatus() {
	memberId := c.GetSessionUsername()
	objectId := c.Input().Get("id")
	favoritesTypeStr := c.Input().Get("type")
	favoritesType := util.ParseInt(favoritesTypeStr)

	var resp Response
	if favoritesType <= 3 && favoritesType >= 1 {
		res := object.GetFavoritesStatus(memberId, objectId, favoritesType)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetFavorites() {
	memberId := c.GetSessionUsername()
	favoritesTypeStr := c.Input().Get("type")
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
	favoritesType := util.ParseInt(favoritesTypeStr)

	var resp Response
	switch favoritesType {
	case 1:
		res := object.GetTopicsFromFavorites(memberId, limit, offset)
		num := object.GetFavoritesNum(1, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	case 2:
		res := object.GetFollowingNewAction(memberId, limit, offset)
		num := object.GetFavoritesNum(2, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	case 3:
		res := object.GetNodesFromFavorites(memberId, limit, offset)
		num := object.GetFavoritesNum(3, memberId)
		resp = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
		break
	default:
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetAccountFavoriteNum() {
	memberId := c.GetSessionUsername()

	var res [4]int
	var wg sync.WaitGroup

	for i := 1; i <= 3; i++ {
		wg.Add(1)
		i := i
		go func() {
			if i == 2 {
				res[i] = object.GetFollowingNum(memberId)
			} else {
				res[i] = object.GetFavoritesNum(i, memberId)
			}
			wg.Done()
		}()
	}
	wg.Wait()

	var resp Response
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}
