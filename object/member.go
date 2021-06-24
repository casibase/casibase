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
	"strings"

	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

// Member using figure 1-3 to show member's account status, 1 means normal, 2 means mute(couldn't reply or post new topic), 3 means forbidden(couldn't login).
type Member struct {
	Id                 string `xorm:"varchar(100) notnull pk" json:"id"`
	Password           string `xorm:"varchar(100) notnull" json:"-"`
	No                 int    `json:"no"`
	IsModerator        bool   `xorm:"bool" json:"isModerator"`
	CreatedTime        string `xorm:"varchar(40)" json:"createdTime"`
	Phone              string `xorm:"varchar(100)" json:"phone"`
	AreaCode           string `xorm:"varchar(10)" json:"areaCode"` // phone area code
	PhoneVerifiedTime  string `xorm:"varchar(40)" json:"phoneVerifiedTime"`
	Avatar             string `xorm:"varchar(150)" json:"avatar"`
	Email              string `xorm:"varchar(100)" json:"email"`
	EmailVerifiedTime  string `xorm:"varchar(40)" json:"emailVerifiedTime"`
	Tagline            string `xorm:"varchar(100)" json:"tagline"`
	Company            string `xorm:"varchar(100)" json:"company"`
	CompanyTitle       string `xorm:"varchar(100)" json:"companyTitle"`
	Ranking            int    `json:"ranking"`
	Score              int    `json:"score"`
	Bio                string `xorm:"varchar(100)" json:"bio"`
	Website            string `xorm:"varchar(100)" json:"website"`
	Location           string `xorm:"varchar(100)" json:"location"`
	Language           string `xorm:"varchar(10)"  json:"language"`
	EditorType         string `xorm:"varchar(10)"  json:"editorType"`
	FileQuota          int    `xorm:"int" json:"fileQuota"`
	GoogleAccount      string `xorm:"varchar(100)" json:"googleAccount"`
	GithubAccount      string `xorm:"varchar(100)" json:"githubAccount"`
	WechatAccount      string `xorm:"varchar(100)" json:"weChatAccount"`
	WechatOpenId       string `xorm:"varchar(100)" json:"-"`
	WechatVerifiedTime string `xorm:"varchar(40)" json:"WechatVerifiedTime"`
	QQAccount          string `xorm:"qq_account varchar(100)" json:"qqAccount"`
	QQOpenId           string `xorm:"qq_open_id varchar(100)" json:"-"`
	QQVerifiedTime     string `xorm:"qq_verified_time varchar(40)" json:"qqVerifiedTime"`
	EmailReminder      bool   `xorm:"bool" json:"emailReminder"`
	CheckinDate        string `xorm:"varchar(20)" json:"-"`
	OnlineStatus       bool   `xorm:"bool" json:"onlineStatus"`
	LastActionDate     string `xorm:"varchar(40)" json:"-"`
	Status             int    `xorm:"int" json:"-"`
	RenameQuota        int    `json:"renameQuota"`
}

func GetMembersOld() []*Member {
	members := []*Member{}
	err := adapter.Engine.Asc("created_time").Find(&members)
	if err != nil {
		panic(err)
	}

	return members
}

func GetMembers() []*Member {
	members := GetMembersFromCasdoor()

	sort.SliceStable(members, func(i, j int) bool {
		return members[i].CreatedTime < members[j].CreatedTime
	})

	return members
}

func GetRankingRich() []*Member {
	members := GetMembersFromCasdoor()
	members = Limit(members, 0, 25)

	sort.SliceStable(members, func(i, j int) bool {
		return members[i].Score > members[j].Score
	})

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
			return members[i].Id < members[j].Id
		}
		return members[i].Id > members[j].Id
	})

	members = Limit(members, offset, limit)

	var res []*AdminMemberInfo
	count := 0

	// count id like %un%
	for _, member := range members {
		if strings.Contains(member.Id, un) {
			count++
			res = append(res, &AdminMemberInfo{
				Member: *member,
				Status: member.Status,
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

	return &AdminMemberInfo{
		Member:        *member,
		FileQuota:     member.FileQuota,
		FileUploadNum: GetFilesNum(id),
		Status:        member.Status,
		TopicNum:      GetCreatedTopicsNum(id),
		ReplyNum:      GetMemberRepliesNum(id),
		LatestLogin:   member.CheckinDate,
		Score:         member.Score,
	}
}

func GetMember(id string) *Member {
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
func UpdateMember(id string, member *Member) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.FileQuota = member.FileQuota
	targetMember.Status = member.Status
	targetMember.Score = member.Score

	return UpdateMemberToCasdoor(targetMember)
}

func UpdateMemberInfo(id string, member *Member) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Company = member.Company
	targetMember.Bio = member.Bio
	targetMember.Website = member.Website
	targetMember.Tagline = member.Tagline
	targetMember.CompanyTitle = member.CompanyTitle
	targetMember.Location = member.Location

	return UpdateMemberToCasdoor(targetMember)
}

// ChangeMemberEmailReminder change member's email reminder status
func ChangeMemberEmailReminder(id, status string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	if status == "true" {
		targetMember.EmailReminder = true
	} else {
		targetMember.EmailReminder = false
	}

	return UpdateMemberToCasdoor(targetMember)
}

func UpdateMemberAvatar(id string, avatar string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Avatar = avatar

	return UpdateMemberToCasdoor(targetMember)
}

func UpdateMemberEditorType(id string, editorType string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.EditorType = editorType

	return UpdateMemberToCasdoor(targetMember)
}

func GetMemberEditorType(id string) string {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return ""
	}

	return targetMember.EditorType
}

func UpdateMemberLanguage(id string, language string) bool {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false
	}

	targetMember.Language = language

	return UpdateMemberToCasdoor(targetMember)
}

func GetMemberLanguage(id string) string {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return ""
	}

	return targetMember.Language
}

func AddMember(member *Member) bool {
	return AddMemberToCasdoor(member)
}

// DeleteMember change this function to update member status.
func DeleteMember(id string) bool {
	return DeleteMemberFromCasdoor(id)
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

	return targetMember.EmailReminder, targetMember.Email
}

func GetMemberByEmail(email string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Email == email {
			return member
		}
	}
	return nil
}

func GetPhoneNumber(phoneNumber string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.Phone == phoneNumber {
			return member
		}
	}
	return nil
}

func GetGoogleAccount(googleAccount string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.GoogleAccount == googleAccount {
			return member
		}
	}
	return nil
}

func GetQQAccount(qqOpenId string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.QQOpenId == qqOpenId {
			return member
		}
	}
	return nil
}

func GetWechatAccount(wechatOpenId string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.WechatOpenId == wechatOpenId {
			return member
		}
	}
	return nil
}

func GetGithubAccount(githubAccount string) *Member {
	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.GithubAccount == githubAccount {
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

	return member.CheckinDate
}

func UpdateMemberCheckinDate(id, date string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}

	member.CheckinDate = date
	return UpdateMemberToCasdoor(member)
}

func CheckModIdentity(memberId string) bool {
	member := GetMemberFromCasdoor(memberId)
	if member == nil {
		return false
	}

	return member.IsModerator
}

func UpdateMemberPassword(id, password string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}

	member.Password = password

	return UpdateMemberToCasdoor(member)
}

func GetMemberFileQuota(memberId string) int {
	member := GetMemberFromCasdoor(memberId)
	if member == nil {
		return 0
	}

	return member.FileQuota
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
			if member.Email == information && member.EmailVerifiedTime != "" {
				return member.Id
			}

			if member.Phone == information && member.PhoneVerifiedTime != "" {
				return member.Id
			}

			if member.Id == information {
				return member.Id
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

	return member.Status
}

// UpdateMemberOnlineStatus updates member's online information.
func UpdateMemberOnlineStatus(id string, onlineStatus bool, lastActionDate string) bool {
	member := GetMemberFromCasdoor(id)
	if member == nil {
		return false
	}
	member.OnlineStatus = onlineStatus
	member.LastActionDate = lastActionDate

	return UpdateMemberToCasdoor(member)
}

func ExpiredMemberOnlineStatus(date string) int {
	affected := 0

	members := GetMembersFromCasdoor()
	for _, member := range members {
		if member.OnlineStatus && member.LastActionDate < date {
			member.OnlineStatus = false
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
		if member.OnlineStatus {
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
	if member.RenameQuota < 1 {
		return "You have no chance to reset you name."
	}
	member.RenameQuota--
	_, err := adapter.Engine.Query("update member set rename_quota = ? where id = ?", member.RenameQuota, oldUsername)
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

func AddMemberByNameAndEmailIfNotExist(username, email string) *Member {
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
	if newMember == nil {
		newMember = &Member{
			Id:                username,
			No:                GetMemberNum() + 1,
			CreatedTime:       util.GetCurrentTime(),
			Avatar:            UploadFromGravatar(username, email),
			Email:             email,
			EmailVerifiedTime: util.GetCurrentTime(),
			Score:             200,
			FileQuota:         DefaultUploadFileQuota,
			RenameQuota:       DefaultRenameQuota,
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
