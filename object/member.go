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
	"crypto/md5"
	"fmt"
	"io/ioutil"
	"sort"
	"strconv"
	"strings"

	beego "github.com/beego/beego/v2/adapter"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
)

// Member using figure 1-3 to show member's account status, 1 means normal, 2 means mute(couldn't reply or post new topic), 3 means forbidden(couldn't login).

func GetMembers() []*auth.User {
	members := GetMembersFromCasdoor()

	sort.SliceStable(members, func(i, j int) bool {
		return members[i].CreatedTime < members[j].CreatedTime
	})

	return members
}

func GetRankingRich() []*auth.User {
	members := GetMembersFromCasdoor()

	sort.SliceStable(members, func(i, j int) bool {
		return members[i].Score > members[j].Score
	})

	members = Limit(members, 0, 25)

	return members
}

// GetMembersAdmin cs, us: 1 means Asc, 2 means Desc, 0 means no effect.
func GetMembersAdmin(cs, us, un string, limit int, offset int) ([]*AdminMemberInfo, int) {
	members := GetMembersFromCasdoor()

	// created time sort
	sort.SliceStable(members, func(i, j int) bool {
		if cs == "1" {
			return members[i].CreatedTime < members[j].CreatedTime
		}
		return members[i].CreatedTime > members[j].CreatedTime
	})

	// id/username sort
	sort.SliceStable(members, func(i, j int) bool {
		if us == "1" {
			return members[i].Name < members[j].Name
		}
		return members[i].Name > members[j].Name
	})

	members = Limit(members, offset, limit)

	var res []*AdminMemberInfo
	count := 0

	// count id like %un%
	for _, member := range members {
		if strings.Contains(member.Name, un) {
			count++
			status, err := strconv.Atoi(member.Properties["status"])
			if err != nil {
				status = 0
			}
			res = append(res, &AdminMemberInfo{
				User:   *member,
				Status: status,
			})
		}
	}

	return res, count
}

func GetMemberAdmin(id string) *AdminMemberInfo {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return nil
	}

	fileQuota, err := strconv.Atoi(member.Properties["fileQuota"])
	if err != nil {
		fileQuota = 0
	}
	return &AdminMemberInfo{
		User:          *member,
		FileQuota:     fileQuota,
		FileUploadNum: GetFilesNum(id),
		TopicNum:      GetCreatedTopicsNum(id),
		ReplyNum:      GetMemberRepliesNum(id),
		LatestLogin:   member.Properties["checkinDate"],
		Score:         member.Score,
	}
}

func GetMember(id string) *auth.User {
	return GetMemberFromCasdoor(id)
}

func GetMemberAvatar(id string) string {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return ""
	}
	return member.Avatar
}

func GetMemberNum() int {
	members := GetMembersFromCasdoor()
	return len(members)
}

// UpdateMember could update member's file quota and account status.
func UpdateMember(id string, member *auth.User) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Properties = member.Properties
	targetMember.Score = member.Score

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

func UpdateMemberInfo(id string, member *auth.User) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Affiliation = member.Affiliation
	targetMember.Properties = member.Properties

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

// ChangeMemberEmailReminder change member's email reminder status
func ChangeMemberEmailReminder(id, status string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Properties["emailReminder"] = status

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

func UpdateMemberAvatar(id string, avatar string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Avatar = avatar

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

func UpdateMemberEditorType(id string, editorType string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Properties["editorType"] = editorType

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

func GetMemberEditorType(id string) string {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return ""
	}

	return targetMember.Properties["editorType"]
}

func UpdateMemberLanguage(id string, language string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Language = language

	affected, err := auth.UpdateUser(*targetMember)
	if err != nil {
		panic(err)
	}
	return affected
}

func GetMemberLanguage(id string) string {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return ""
	}

	return targetMember.Language
}

func AddMember(member *auth.User) bool {
	affected, err := auth.AddUser(*member)
	if err != nil {
		panic(err)
	}
	return affected
}

// DeleteMember change this function to update member status.
func DeleteMember(id string) bool {
	affected, err := auth.DeleteUser(*GetMemberFromCasdoor(id))
	if err != nil {
		panic(err)
	}
	return affected
}

// GetMemberMail return member's email.
func GetMemberMail(id string) string {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return ""
	}

	return targetMember.Email
}

// GetMemberEmailReminder return member's email reminder status, and his email address.
func GetMemberEmailReminder(id string) (bool, string) {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false, ""
	}

	emailReminder, err := strconv.ParseBool(targetMember.Properties["emailReminder"])
	if err != nil {
		emailReminder = false
	}
	return emailReminder, targetMember.Email
}

func GetMemberByEmail(email string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Email == email {
			return member
		}
	}
	return nil
}

func GetPhoneNumber(phoneNumber string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Phone == phoneNumber {
			return member
		}
	}
	return nil
}

func GetGoogleAccount(googleAccount string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Google == googleAccount {
			return member
		}
	}
	return nil
}

func GetQQAccount(qqOpenId string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.QQ == qqOpenId {
			return member
		}
	}
	return nil
}

func GetWechatAccount(wechatOpenId string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.WeChat == wechatOpenId {
			return member
		}
	}
	return nil
}

func GetGithubAccount(githubAccount string) *auth.User {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Github == githubAccount {
			return member
		}
	}
	return nil
}

// LinkMemberAccount is not used
//func LinkMemberAccount(memberId, field, value string) bool {
//	affected, err := adapter.Engine.Table(new(Member)).ID(memberId).Update(map[string]interface{}{field: value})
//	if err != nil {
//		panic(err)
//	}
//
//	return affected != 0
//}

func GetMemberCheckinDate(id string) string {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return ""
	}

	return member.Properties["checkinDate"]
}

func UpdateMemberCheckinDate(id, date string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}

	member.Properties["checkinDate"] = date
	affected, err := auth.UpdateUser(*member)
	if err != nil {
		panic(err)
	}
	return affected
}

func CheckModIdentity(memberId string) bool {
	member := GetMemberFromCasdoor(memberId)
	if member == nil {
		return false
	}

	return member.IsAdmin
}

func UpdateMemberPassword(id, password string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}

	member.Password = password

	affected, err := auth.UpdateUser(*member)
	if err != nil {
		panic(err)
	}
	return affected
}

func GetMemberFileQuota(memberId string) int {
	member := GetMemberFromCasdoor(memberId)
	if member == nil {
		return 0
	}

	fileQuota, err := strconv.Atoi(member.Properties["fileQuota"])
	if err != nil {
		fileQuota = 0
	}
	return fileQuota
}

// MemberPasswordLogin needs information and password to check member login.
// Information could be phone member, email or username.
// If success, return username.
func MemberPasswordLogin(information, password string) string {
	if len(password) == 0 || strings.Index(password, " ") >= 0 {
		return ""
	}

	members := GetMembersFromCasdoor()

	for _, member := range members {
		if member.Password == password {
			if member.Email == information && member.Properties["emailVerifiedTime"] != "" {
				return member.Name
			}

			if member.Phone == information && member.Properties["phoneVerifiedTime"] != "" {
				return member.Name
			}

			if member.Name == information {
				return member.Name
			}
		}
	}

	return ""
}

// GetMemberStatus returns member's account status, default 3(forbidden).
func GetMemberStatus(id string) int {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return 3
	}

	status, err := strconv.Atoi(member.Properties["status"])
	if err != nil {
		status = 0
	}
	return status
}

// UpdateMemberOnlineStatus updates member's online information.
func UpdateMemberOnlineStatus(id string, onlineStatus bool, lastActionDate string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}
	member.Properties["onlineStatus"] = strconv.FormatBool(onlineStatus)
	member.Properties["lastActionDate"] = lastActionDate

	affected, err := auth.UpdateUser(*member)
	if err != nil {
		panic(err)
	}
	return affected
}

func ExpiredMemberOnlineStatus(date string) int {
	affected := 0

	members := GetMembersFromCasdoor()
	for _, member := range members {
		onlineStatus, err := strconv.ParseBool(member.Properties["onlineStatus"])
		if err != nil {
			panic(err)
		}
		if onlineStatus && member.UpdatedTime < date {
			member.Properties["onlineStatus"] = "false"
			affected++
		}
	}

	if UpdateMembersToCasdoor(members) {
		return affected
	}
	return 0
}

func GetMemberOnlineNum() int {
	total := 0
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Properties["onlineStatus"] == "true" {
			total++
		}
	}

	return total
}

type UpdateListItem struct {
	Table     string
	Attribute string
}

func ResetUsername(oldUsername string, newUsername string) string {
	return "Not allowed!"

	if len(newUsername) == 0 || len(newUsername) > 100 || strings.Index(newUsername, " ") >= 0 {
		return "Illegal username"
	}
	if HasMember(newUsername) {
		return "User exists"
	}

	member := GetMember(oldUsername)
	renameQuota, err := strconv.Atoi(member.Properties["renameQuota"])
	if err != nil {
		panic(err)
	}
	if renameQuota < 1 {
		return "You have no chance to reset you name."
	}
	renameQuota--
	member.Properties["renameQuota"] = strconv.Itoa(renameQuota)
	_, err = adapter.Engine.Query("update member set rename_quota = ? where id = ?", renameQuota, oldUsername)
	if err != nil {
		panic(err)
	}

	updateList := []UpdateListItem{
		{"member", "id"},
		{"browse_record", "member_id"},
		{"consumption_record", "consumer_id"},
		{"consumption_record", "receiver_id"},
		{"favorites", "member_id"},
		{"node", "moderators"},
		{"notification", "sender_id"},
		{"notification", "receiver_id"},
		{"reply", "author"},
		{"reset_record", "member_id"},
		{"topic", "author"},
		{"topic", "last_reply_user"},
		{"upload_file_record", "member_id"},
	}
	for _, value := range updateList {
		_, err = adapter.Engine.Query("update "+value.Table+" set "+value.Attribute+" = ? where "+value.Attribute+" = ?", newUsername, oldUsername)
		if err != nil {
			panic(err)
		}
	}

	return ""
}

func AddMemberByNameAndEmailIfNotExist(username, email string) *auth.User {
	username = strings.ReplaceAll(username, " ", "")
	email = strings.ReplaceAll(email, " ", "")
	if len(username) == 0 {
		return nil
	}
	if HasMember(username) {
		return GetMember(username)
	}
	if len(email) == 0 {
		return nil
	}
	username = strings.Split(email, "@")[0]
	if HasMember(username) {
		return GetMember(username)
	}
	newMember := GetMemberByEmail(email)

	var score int
	score, err := strconv.Atoi(beego.AppConfig.String("initScore"))
	if err != nil {
		panic(err)
	}

	if newMember == nil {
		newMember = &auth.User{
			Name:        username,
			CreatedTime: util.GetCurrentTime(),
			Avatar:      UploadFromGravatar(username, email),
			Email:       email,
			Score:       score,
			Properties: map[string]string{
				"no":                strconv.Itoa(GetMemberNum() + 1),
				"emailVerifiedTime": util.GetCurrentTime(),
				"fileQuota":         strconv.Itoa(DefaultUploadFileQuota),
				"renameQuota":       strconv.Itoa(DefaultRenameQuota),
			},
		}
		AddMember(newMember)
	}
	return newMember
}

func UploadFromGravatar(username, email string) string {
	requestUrl := fmt.Sprintf("https://www.gravatar.com/avatar/%x?d=retro", md5.Sum([]byte(email)))
	resp, err := HttpClient.Get(requestUrl)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	avatarByte, _ := ioutil.ReadAll(resp.Body)
	return service.UploadAvatarToOSS(avatarByte, username)
}
