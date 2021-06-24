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
	"encoding/json"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

// @Title GetMembers
// @Description Get all members
// @Success 200 {array} object.Member The Response object
// @router /get-members [get]
func (c *ApiController) GetMembers() {
	c.Data["json"] = object.GetMembers()
	c.ServeJSON()
}

// @Title GetMembersAdmin
// @Description Get admin allmembers
// @Param limit query int true "limit"
// @Param page query int true "page"
// @Param un query string true "search: username"
// @Param cs query int true "sort: created time"
// @Param us query int true "sort: username"
// @Success 200 {object} controllers.api_controller.Response The Response object
// @router /get-members-admin [get]
func (c *ApiController) GetMembersAdmin() {
	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	un := c.Input().Get("un") // search: username
	cs := c.Input().Get("cs") // sort: created time
	us := c.Input().Get("us") // sort: username
	defaultLimit := object.DefaultMemberAdminPageNum

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

	res, num := object.GetMembersAdmin(cs, us, un, limit, offset)

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: res, Data2: num}
	c.ServeJSON()
}

// @Title GetMemberAdmin
// @Description get member for admin by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} object.AdminMemberInfo The Response object
// @router /get-member-admin [get]
func (c *ApiController) GetMemberAdmin() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberAdmin(id)
	c.ServeJSON()
}

// @Title GetMember
// @Description get member by id
// @Param   id     query    string  true        "id"
// @Success 200 {object} object.Member The Response object
// @router /get-member [get]
func (c *ApiController) GetMember() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMember(id)
	c.ServeJSON()
}

// @Title GetMemberAvatar
// @Description get member avatar by id
// @Param   id     query    string  true        "id"
// @Success 200 {string} string Avatarlink
// @router /get-member-avatar [get]
func (c *ApiController) GetMemberAvatar() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberAvatar(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateMemberAvatar() {
	memberId := c.GetSessionUsername()
	avatar := c.Input().Get("avatar")

	c.Data["json"] = object.UpdateMemberAvatar(memberId, avatar)
	c.ServeJSON()
}

func (c *ApiController) UpdateMemberEmailReminder() {
	memberId := c.GetSessionUsername()
	status := c.Input().Get("status")

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: object.ChangeMemberEmailReminder(memberId, status)}
	c.ServeJSON()
}

func (c *ApiController) UpdateMember() {
	id := c.Input().Get("id")
	memberId := c.GetSessionUsername()

	var member object.Member
	var memberInfo object.AdminMemberInfo
	var resp Response
	var balanceType int

	if !object.CheckModIdentity(c.GetSessionUsername()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &memberInfo)
	if err != nil {
		panic(err)
	}

	member.FileQuota = memberInfo.FileQuota
	member.Status = memberInfo.Status
	member.Score = memberInfo.Score

	amount := member.Score - object.GetMemberBalance(id)
	if amount != 0 {
		if amount > 0 {
			balanceType = 10
		} else {
			balanceType = 11
		}
		record := object.ConsumptionRecord{
			Amount:          amount,
			Balance:         member.Score,
			ReceiverId:      id,
			ConsumerId:      memberId,
			CreatedTime:     util.GetCurrentTime(),
			ConsumptionType: balanceType,
		}
		object.AddBalance(&record)
	}

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: object.UpdateMember(id, &member)}
	c.ServeJSON()
}

func (c *ApiController) UpdateMemberInfo() {
	id := c.Input().Get("id")
	memberId := c.GetSessionUsername()

	var tempMember object.Member
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tempMember)
	if err != nil {
		panic(err)
	}

	var resp Response
	if memberId != id {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
	} else {
		var member = object.Member{
			Company:      tempMember.Company,
			CompanyTitle: tempMember.CompanyTitle,
			Bio:          tempMember.Bio,
			Website:      tempMember.Website,
			Tagline:      tempMember.Tagline,
			Location:     tempMember.Location,
		}
		res := object.UpdateMemberInfo(id, &member)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetMemberEditorType
// @Description member editortype
// @Success 200 {object} controllers.Response The Response object
// @router /get-member-editor-type [get]
func (c *ApiController) GetMemberEditorType() {
	memberId := c.GetSessionUsername()

	var resp Response
	var editorType string

	if len(memberId) == 0 {
		editorType = ""
	} else {
		editorType = object.GetMemberEditorType(memberId)
	}

	resp = Response{Status: "ok", Msg: "success", Data: editorType}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetRankingRich
// @Description RankingRich
// @Success 200 {array} object.Member The Response object
// @router /get-ranking-rich [get]
func (c *ApiController) GetRankingRich() {
	c.Data["json"] = object.GetRankingRich()
	c.ServeJSON()
}

func (c *ApiController) UpdateMemberEditorType() {
	editorType := c.Input().Get("editorType")
	memberId := c.GetSessionUsername()

	var resp Response

	if editorType != "markdown" && editorType != "richtext" {
		resp = Response{Status: "fail", Msg: "Bad request."}
		c.Data["json"] = resp
		c.ServeJSON()
	}

	res := object.UpdateMemberEditorType(memberId, editorType)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateMemberLanguage() {
	language := c.Input().Get("language")
	memberId := c.GetSessionUsername()

	var resp Response

	if language != "zh" && language != "en" {
		resp = Response{Status: "fail", Msg: "Bad request."}
		c.Data["json"] = resp
		c.ServeJSON()
	}

	clain := c.GetSessionUser()
	if clain == nil {
		resp = Response{Status: "ok", Msg: "success"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	} else {
		clain.Language = language
	}
	c.SetSessionUser(clain)

	res := object.UpdateMemberLanguage(memberId, language)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetMemberLanguage
// @Description MemberLanguage
// @Success 200 {object} controllers.Response The Response object
// @router /get-member-language [get]
func (c *ApiController) GetMemberLanguage() {
	memberId := c.GetSessionUsername()

	var resp Response
	var language string

	if len(memberId) == 0 {
		language = ""
	} else {
		language = object.GetMemberLanguage(memberId)
	}

	resp = Response{Status: "ok", Msg: "success", Data: language}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title AddMember
// @Description AddMember
// @Success 200 {object} controllers.Response The Response object
// @router /add-member [post]
func (c *ApiController) AddMember() {
	var member object.Member
	var resp Response
	if !object.CheckModIdentity(c.GetSessionUsername()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &member)
	if err != nil {
		panic(err)
	}
	member.No = object.GetMemberNum() + 1
	member.Avatar = UploadAvatarToOSS("", member.Id)
	if object.GetMember(member.Id) == nil {
		if object.AddMember(&member) {
			resp = Response{Status: "ok", Msg: "success"}
		}
	} else {
		resp = Response{Status: "error", Msg: "Add new member error"}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DeleteMember() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteMember(id)
	c.ServeJSON()
}

func (c *ApiController) ResetUsername() {
	var resp Response
	memberId := c.GetSessionUsername()
	newUsername := c.Input().Get("new")

	if len(memberId) == 0 {
		resp = Response{Status: "error", Msg: "Login first"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if len(newUsername) == 0 {
		resp = Response{Status: "error", Msg: "Parameter lost: new"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	msg := object.ResetUsername(memberId, newUsername)

	if msg == "" {
		resp = Response{Status: "ok", Msg: "Succeed. Please login again."}
		c.SetSessionUser(nil)
	} else {
		resp = Response{Status: "error", Msg: msg}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}
