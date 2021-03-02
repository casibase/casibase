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

	"github.com/casbin/casbin-forum/object"
	"github.com/casbin/casbin-forum/util"
)

func (c *APIController) GetMembers() {
	c.Data["json"] = object.GetMembers()
	c.ServeJSON()
}

func (c *APIController) GetMembersAdmin() {
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

func (c *APIController) GetMemberAdmin() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberAdmin(id)
	c.ServeJSON()
}

func (c *APIController) GetMember() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMember(id)
	c.ServeJSON()
}

func (c *APIController) GetMemberAvatar() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetMemberAvatar(id)
	c.ServeJSON()
}

func (c *APIController) UpdateMemberAvatar() {
	memberId := c.GetSessionUser()
	avatar := c.Input().Get("avatar")

	c.Data["json"] = object.UpdateMemberAvatar(memberId, avatar)
	c.ServeJSON()
}

func (c *APIController) UpdateMemberEmailReminder() {
	memberId := c.GetSessionUser()
	status := c.Input().Get("status")

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: object.ChangeMemberEmailReminder(memberId, status)}
	c.ServeJSON()
}

func (c *APIController) UpdateMember() {
	id := c.Input().Get("id")

	var member object.Member
	var memberInfo object.AdminMemberInfo
	var resp Response

	if !object.CheckModIdentity(c.GetSessionUser()) {
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

	c.Data["json"] = Response{Status: "ok", Msg: "success", Data: object.UpdateMember(id, &member)}
	c.ServeJSON()
}

func (c *APIController) UpdateMemberInfo() {
	id := c.Input().Get("id")
	memberId := c.GetSessionUser()

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

func (c *APIController) GetMemberEditorType() {
	memberId := c.GetSessionUser()

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

func (c *APIController) GetRankingRich() {
	c.Data["json"] = object.GetRankingRich()
	c.ServeJSON()
}

func (c *APIController) UpdateMemberEditorType() {
	editorType := c.Input().Get("editorType")
	memberId := c.GetSessionUser()

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

func (c *APIController) UpdateMemberLanguage() {
	language := c.Input().Get("language")
	memberId := c.GetSessionUser()

	var resp Response

	if language != "zh" && language != "en" {
		resp = Response{Status: "fail", Msg: "Bad request."}
		c.Data["json"] = resp
		c.ServeJSON()
	}

	res := object.UpdateMemberLanguage(memberId, language)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *APIController) GetMemberLanguage() {
	memberId := c.GetSessionUser()

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

func (c *APIController) AddMember() {
	var member object.Member
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &member)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddMember(&member)
	c.ServeJSON()
}

func (c *APIController) DeleteMember() {
	id := c.Input().Get("id")

	c.Data["json"] = object.DeleteMember(id)
	c.ServeJSON()
}
