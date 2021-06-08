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

//import (
//	"strconv"
//
//	"github.com/casbin/casnode/auth"
//	"github.com/casbin/casnode/object"
//)
//
//func CreateCasdoorUserFromMember(member *object.Member) *auth.User {
//	if member == nil {
//		return nil
//	}
//
//	properties := map[string]string{}
//	properties["tagline"] = member.Tagline
//	properties["bio"] = member.Bio
//	properties["website"] = member.Website
//	properties["location"] = member.Location
//	properties["checkinDate"] = member.CheckinDate
//	properties["emailVerifiedTime"] = member.EmailVerifiedTime
//	properties["phoneVerifiedTime"] = member.PhoneVerifiedTime
//	properties["oauth_QQ_displayName"] = member.QQAccount
//	properties["oauth_QQ_verifiedTime"] = member.QQVerifiedTime
//	properties["fileQuota"] = strconv.Itoa(member.FileQuota)
//	properties["oauth_WeChat_displayName"] = member.WechatAccount
//	properties["oauth_WeChat_verifiedTime"] = member.WechatVerifiedTime
//	properties["editorType"] = member.EditorType
//	properties["renameQuota"] = strconv.Itoa(member.RenameQuota)
//
//	user := &auth.User{
//		Owner:         "casbin-forum",
//		Name:          member.Id,
//		CreatedTime:   member.CreatedTime,
//		UpdatedTime:   member.LastActionDate,
//		Id:            strconv.Itoa(member.No),
//		Type:          "normal-user",
//		Password:      member.Password,
//		DisplayName:   member.Id,
//		Avatar:        member.Avatar,
//		Email:         member.Email,
//		Phone:         member.Phone,
//		Affiliation:   member.Company,
//		Tag:           member.CompanyTitle,
//		Language:      member.Language,
//		Score:         member.Score,
//		IsAdmin:       member.IsModerator,
//		IsGlobalAdmin: false,
//		IsForbidden:   false,
//		Github:        member.GithubAccount,
//		Google:        member.GoogleAccount,
//		QQ:            member.QQOpenId,
//		WeChat:        member.WechatOpenId,
//		Properties:    properties,
//	}
//	return user
//}
//
//func CreateMemberFromCasdoorUser(user *auth.User) *object.Member {
//	if user == nil {
//		return nil
//	}
//
//	no, _ := strconv.Atoi(user.Id)
//	fileQuota, _ := strconv.Atoi(user.Properties["fileQuota"])
//	renameQuota, _ := strconv.Atoi(user.Properties["renameQuota"])
//
//	return &object.Member{
//		Id:                 user.Name,
//		CreatedTime:        user.CreatedTime,
//		LastActionDate:     user.UpdatedTime,
//		No:                 no,
//		Password:           user.Password,
//		Avatar:             user.Avatar,
//		Email:              user.Email,
//		Phone:              user.Phone,
//		Company:            user.Affiliation,
//		CompanyTitle:       user.Tag,
//		Language:           user.Language,
//		Score:              user.Score,
//		IsModerator:        user.IsAdmin,
//		GithubAccount:      user.Github,
//		GoogleAccount:      user.Google,
//		QQOpenId:           user.QQ,
//		WechatOpenId:       user.WeChat,
//		Tagline:            user.Properties["tagline"],
//		Bio:                user.Properties["bio"],
//		Website:            user.Properties["website"],
//		Location:           user.Properties["location"],
//		CheckinDate:        user.Properties["checkinDate"],
//		EmailVerifiedTime:  user.Properties["emailVerifiedTime"],
//		PhoneVerifiedTime:  user.Properties["phoneVerifiedTime"],
//		QQAccount:          user.Properties["oauth_QQ_displayName"],
//		QQVerifiedTime:     user.Properties["oauth_QQ_verifiedTime"],
//		FileQuota:          fileQuota,
//		WechatAccount:      user.Properties["oauth_WeChat_displayName"],
//		WechatVerifiedTime: user.Properties["oauth_WeChat_verifiedTime"],
//		EditorType:         user.Properties["editorType"],
//		RenameQuota:        renameQuota,
//	}
//}
//
//func ConvertFromCasdoorUsers(users []*auth.User) []*object.Member {
//	var members []*object.Member
//	var member *object.Member
//
//	for _, user := range users {
//		member = CreateMemberFromCasdoorUser(user)
//		members = append(members, member)
//	}
//
//	return members
//}
