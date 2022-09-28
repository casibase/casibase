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
	"fmt"

	"github.com/casbin/casnode/object"
)

// @Title GetMember
// @Description get member by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} casdoorsdk.User The Response object
// @router /get-member [get]
// @Tag Member API
func (c *ApiController) GetMember() {
	id := c.Input().Get("id")

	c.ResponseOk(object.GetUser(id))
}

// @Title GetMemberEditorType
// @Description member editortype
// @Success 200 {object} controllers.Response The Response object
// @router /get-member-editor-type [get]
// @Tag Member API
func (c *ApiController) GetMemberEditorType() {
	user := c.GetSessionUser()

	editorType := ""
	if user != nil {
		editorType = object.GetMemberEditorType(user)
	}

	c.ResponseOk(editorType)
}

// @Title GetRankingRich
// @Description RankingRich
// @Success 200 {array} casdoorsdk.User The Response object
// @router /get-ranking-rich [get]
// @Tag Member API
func (c *ApiController) GetRankingRich() {
	users, err := object.GetRankingRich()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(users)
}

// @Title GetRankingPlayer
// @Description RankingPlayer
// @Success 200 {array} casdoorsdk.User The Response object
// @router /get-ranking-player [get]
// @Tag Member API
func (c *ApiController) GetRankingPlayer() {
	users, err := object.GetRankingPlayer()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(users)
}

// @Tag Member API
// @Title UpdateMemberEditorType
// @router /update-member-editor-type [post]
func (c *ApiController) UpdateMemberEditorType() {
	editorType := c.Input().Get("editorType")
	user := c.GetSessionUser()

	if editorType != "markdown" && editorType != "richtext" {
		c.ResponseError(fmt.Errorf("unsupported editor type: %s", editorType).Error())
		return
	}

	affected, err := object.UpdateMemberEditorType(user, editorType)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(affected)
}

// @Tag Member API
// @Title UpdateMemberLanguage
// @router /update-member-language [post]
func (c *ApiController) UpdateMemberLanguage() {
	language := c.Input().Get("language")

	if language != "zh" && language != "en" {
		c.ResponseError(fmt.Errorf("unsupported language: %s", language).Error())
		return
	}

	user := c.GetSessionUser()
	if user == nil {
		c.ResponseOk()
		return
	}

	user.Language = language
	c.SetSessionUser(user)

	affected, err := object.UpdateMemberLanguage(user, language)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(affected)
}

// @Title GetMemberLanguage
// @Description MemberLanguage
// @Success 200 {object} controllers.Response The Response object
// @router /get-member-language [get]
// @Tag Member API
func (c *ApiController) GetMemberLanguage() {
	user := c.GetSessionUser()

	language := ""
	if user != nil {
		language = object.GetMemberLanguage(user)
	}

	c.ResponseOk(language)
}
