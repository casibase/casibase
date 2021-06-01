// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package sync

import (
	"strconv"

	"github.com/casbin/casnode/auth"
	"github.com/casbin/casnode/object"
)

func createCasdoorUserFromMember(member *object.Member) *auth.User {
	properties := map[string]string{}
	properties["tagline"] = member.Tagline
	properties["bio"] = member.Bio
	properties["website"] = member.Website
	properties["location"] = member.Location
	properties["checkinDate"] = member.CheckinDate
	properties["emailVerifiedTime"] = member.EmailVerifiedTime
	properties["phoneVerifiedTime"] = member.PhoneVerifiedTime
	properties["oauth_QQ_displayName"] = member.QQAccount
	properties["oauth_QQ_verifiedTime"] = member.QQVerifiedTime
	properties["fileQuota"] = strconv.Itoa(member.FileQuota)
	properties["oauth_WeChat_displayName"] = member.WechatAccount
	properties["oauth_WeChat_verifiedTime"] = member.WechatVerifiedTime
	properties["editorType"] = member.EditorType
	properties["renameQuota"] = strconv.Itoa(member.RenameQuota)

	user := &auth.User{
		Owner:         "casbin-forum",
		Name:          member.Id,
		CreatedTime:   member.CreatedTime,
		UpdatedTime:   member.LastActionDate,
		Id:            strconv.Itoa(member.No),
		Type:          "normal-user",
		Password:      member.Password,
		DisplayName:   member.Id,
		Avatar:        member.Avatar,
		Email:         member.Email,
		Phone:         member.Phone,
		Affiliation:   member.Company,
		Tag:           member.CompanyTitle,
		Language:      member.Language,
		Score:         member.ScoreCount,
		IsAdmin:       member.IsModerator,
		IsGlobalAdmin: false,
		IsForbidden:   false,
		Github:        member.GithubAccount,
		Google:        member.GoogleAccount,
		QQ:            member.QQOpenId,
		WeChat:        member.WechatOpenId,
		Properties:    properties,
	}
	return user
}
