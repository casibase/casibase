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
	"github.com/astaxie/beego"

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

func (c *APIController) AddFavorites() {
	objectId := c.Input().Get("id")
	favoritesTypeStr := c.Input().Get("type")
	favoritesType := util.ParseInt(favoritesTypeStr)

	memberId := c.GetSessionUser()
	favorites := object.Favorites{
		Id:            util.IntToString(object.GetFavoritesCount()) + memberId,
		FavoritesType: favoritesType,
		ObjectId:      objectId,
		CreatedTime:   util.GetCurrentTime(),
		MemberId:      memberId,
	}

	var resp Response
	if favoritesType <= 3 && favoritesType >= 1 {
		res := object.AddFavorites(&favorites)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) DeleteFavorites() {
	memberId := c.GetSessionUser()
	objectId := c.Input().Get("id")
	favoritesTypeStr := c.Input().Get("type")
	favoritesType := util.ParseInt(favoritesTypeStr)

	var resp Response
	if favoritesType <= 3 && favoritesType >= 1 {
		res := object.DeleteFavorites(memberId, objectId, favoritesType)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	} else {
		resp = Response{Status: "fail", Msg: "param wrong"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetFavoritesStatus() {
	memberId := c.GetSessionUser()
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

// Using figure 1-3 to choose type, 1 means topic, 2 means people, 3 means node.
func (c *APIController) GetFavorites() {
	memberId := c.GetSessionUser()
	favoritesTypeStr := c.Input().Get("type")
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit, _ := beego.AppConfig.Int("defaultPageNum")

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page * limit - defaultLimit
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
		resp = Response{Status: "ok", Msg: "success", Data: res,  Data2: num}
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
