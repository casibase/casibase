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
	"bytes"
	"crypto/md5"
	"fmt"
	"io/ioutil"
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
	ScoreCount         int    `json:"scoreCount"`
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

func GetMembers() []*Member {
	members := []*Member{}
	err := adapter.engine.Asc("created_time").Find(&members)
	if err != nil {
		panic(err)
	}

	return members
}

func GetRankingRich() []*Member {
	members := []*Member{}
	err := adapter.engine.Desc("score_count").Limit(25, 0).Find(&members)
	if err != nil {
		panic(err)
	}
	return members
}

// GetMembersAdmin cs, us: 1 means Asc, 2 means Desc, 0 means no effect.
func GetMembersAdmin(cs, us, un string, limit int, offset int) ([]*AdminMemberInfo, int) {
	members := []*Member{}
	db := adapter.engine.Table("member")

	var bt bytes.Buffer

	// created time sort
	switch cs {
	case "1":
		bt.WriteString("created_time ASC")
	case "2":
		bt.WriteString("created_time DESC")
	}

	if cs != "0" && us != "0" {
		bt.WriteString(", ")
	}

	// id/username sort
	switch us {
	case "1":
		bt.WriteString("id ASC")
	case "2":
		bt.WriteString("id DESC")
	}

	db = db.OrderBy(bt.String())

	if un != "" {
		// search username
		db = db.Where("id like ?", "%"+un+"%")
	}
	// get result
	num, err := db.Limit(limit, offset).FindAndCount(&members, &Member{})
	if err != nil {
		panic(err)
	}

	res := []*AdminMemberInfo{}
	for _, v := range members {
		temp := AdminMemberInfo{
			Member: *v,
			Status: v.Status,
		}
		res = append(res, &temp)
	}

	return res, int(num)
}

func GetMemberAdmin(id string) *AdminMemberInfo {
	member := Member{Id: id}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	res := AdminMemberInfo{
		Member:        member,
		FileQuota:     member.FileQuota,
		FileUploadNum: GetFilesNum(id),
		Status:        member.Status,
		TopicNum:      GetCreatedTopicsNum(id),
		ReplyNum:      GetMemberRepliesNum(id),
		LatestLogin:   member.CheckinDate,
	}

	if existed {
		return &res
	} else {
		return nil
	}
}

func GetMember(id string) *Member {
	member := Member{Id: id}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetMemberAvatar(id string) string {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("avatar").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.Avatar
	} else {
		return ""
	}
}

func GetMemberNum() int {
	count, err := adapter.engine.Count(&Member{})
	if err != nil {
		panic(err)
	}

	return int(count)
}

// UpdateMember could update member's file quota and account status.
func UpdateMember(id string, member *Member) bool {
	if GetMember(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).Cols("file_quota, status").Update(member)
	if err != nil {
		panic(err)
	}

	//return affected != 0
	return true
}

func UpdateMemberInfo(id string, member *Member) bool {
	if GetMember(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).MustCols("company, bio, website, tagline, company_title, location").Update(member)
	if err != nil {
		panic(err)
	}

	return true
}

// ChangeMemberEmailReminder change member's email reminder status
func ChangeMemberEmailReminder(id, status string) bool {
	if GetMember(id) == nil {
		return false
	}

	member := new(Member)
	if status == "true" {
		member.EmailReminder = true
	} else {
		member.EmailReminder = false
	}

	_, err := adapter.engine.Id(id).MustCols("email_reminder").Update(member)
	if err != nil {
		panic(err)
	}

	return true
}

func UpdateMemberAvatar(id string, avatar string) bool {
	if GetMember(id) == nil {
		return false
	}

	member := new(Member)
	member.Avatar = avatar

	_, err := adapter.engine.Id(id).MustCols("avatar").Update(member)
	if err != nil {
		panic(err)
	}

	return true
}

func UpdateMemberEditorType(id string, editorType string) bool {
	if GetMember(id) == nil {
		return false
	}

	member := new(Member)
	member.EditorType = editorType

	_, err := adapter.engine.Id(id).MustCols("editor_type").Update(member)
	if err != nil {
		panic(err)
	}

	return true
}

func GetMemberEditorType(id string) string {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("editor_type").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.EditorType
	} else {
		return ""
	}
}

func UpdateMemberLanguage(id string, language string) bool {
	if GetMember(id) == nil {
		return false
	}

	member := new(Member)
	member.Language = language

	_, err := adapter.engine.Id(id).MustCols("language").Update(member)
	if err != nil {
		panic(err)
	}

	return true
}

func GetMemberLanguage(id string) string {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("language").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.Language
	} else {
		return ""
	}
}

func AddMember(member *Member) bool {
	affected, err := adapter.engine.Insert(member)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// DeleteMember change this function to update member status.
func DeleteMember(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Member{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

// GetMemberMail return member's email.
func GetMemberMail(id string) string {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("email").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.Email
	} else {
		return ""
	}
}

// GetMemberEmailReminder return member's email reminder status, and his email adress.
func GetMemberEmailReminder(id string) (bool, string) {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("email_reminder, email").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.EmailReminder, member.Email
	} else {
		return false, ""
	}
}

func GetMail(email string) *Member {
	member := Member{Email: email}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetPhoneNumber(phoneNumber string) *Member {
	member := Member{Phone: phoneNumber}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetGoogleAccount(googleAccount string) *Member {
	member := Member{GoogleAccount: googleAccount}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetQQAccount(qqOpenId string) *Member {
	member := Member{QQOpenId: qqOpenId}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetWechatAccount(wechatOpenId string) *Member {
	member := Member{WechatOpenId: wechatOpenId}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func GetGithubAccount(githubAccount string) *Member {
	member := Member{GithubAccount: githubAccount}
	existed, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return &member
	} else {
		return nil
	}
}

func LinkMemberAccount(memberId, field, value string) bool {
	affected, err := adapter.engine.Table(new(Member)).ID(memberId).Update(map[string]interface{}{field: value})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetMemberCheckinDate(id string) string {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("checkin_date").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.CheckinDate
	} else {
		return ""
	}
}

func UpdateMemberCheckinDate(id, date string) bool {
	member := new(Member)
	member.CheckinDate = date

	affected, err := adapter.engine.Id(id).MustCols("checkin_date").Update(member)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func CheckModIdentity(memberId string) bool {
	member := Member{}
	existed, err := adapter.engine.Id(memberId).Cols("is_moderator").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.IsModerator
	} else {
		return false
	}
}

func UpdateMemberPassword(id, password string) bool {
	member := new(Member)
	member.Password = password

	affected, err := adapter.engine.Id(id).MustCols("password").Update(member)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetMemberFileQuota(memberId string) int {
	member := Member{}
	existed, err := adapter.engine.Id(memberId).Cols("file_quota").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.FileQuota
	} else {
		return 0
	}
}

// MemberPasswordLogin needs information and password to check member login.
// Information could be phone member, email or username.
// If success, return username.
func MemberPasswordLogin(information, password string) string {
	if len(password) == 0 || strings.Index(password, " ") >= 0 {
		return ""
	}

	member := Member{
		Email:    information,
		Password: password,
	}
	exist, err := adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}
	if exist && member.EmailVerifiedTime != "" {
		return member.Id
	}

	member = Member{
		Phone:    information,
		Password: password,
	}
	exist, err = adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}
	if exist && member.PhoneVerifiedTime != "" {
		return member.Id
	}

	member = Member{
		Id:       information,
		Password: password,
	}
	exist, err = adapter.engine.Get(&member)
	if err != nil {
		panic(err)
	}
	if exist {
		return member.Id
	}

	return ""
}

// GetMemberStatus returns member's account status, default 3(forbidden).
func GetMemberStatus(id string) int {
	member := Member{}
	existed, err := adapter.engine.Id(id).Cols("status").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.Status
	} else {
		return 3
	}
}

// UpdateMemberOnlineStatus updates member's online information.
func UpdateMemberOnlineStatus(id string, onlineStatus bool, lastActionDate string) bool {
	member := new(Member)
	member.OnlineStatus = onlineStatus
	member.LastActionDate = lastActionDate

	affected, err := adapter.engine.Id(id).MustCols("online_status, last_action_date").Update(member)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func ExpiredMemberOnlineStatus(date string) int {
	member := new(Member)
	member.OnlineStatus = false

	affected, err := adapter.engine.Where("online_status = ?", true).And("last_action_date < ?", date).Cols("online_status").Update(member)
	if err != nil {
		panic(err)
	}

	return int(affected)
}

func GetMemberOnlineNum() int {
	var total int64
	var err error

	member := new(Member)
	total, err = adapter.engine.Where("online_status = ?", true).Count(member)
	if err != nil {
		panic(err)
	}

	return int(total)
}

type UpdateListItem struct {
	Table     string
	Attribute string
}

func ResetUsername(oldUsername string, newUsername string) string {
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
	_, err := adapter.engine.Query("update member set rename_quota = ? where id = ?", member.RenameQuota, oldUsername)
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
		_, err = adapter.engine.Query("update "+value.Table+" set "+value.Attribute+" = ? where "+value.Attribute+" = ?", newUsername, oldUsername)
		if err != nil {
			panic(err)
		}
	}

	return ""
}

func GetMemberByEmail(email string) *Member {
	if len(email) == 0 {
		return nil
	}
	var ret Member
	has, err := adapter.engine.Where("email = ?", email).Get(&ret)
	if err != nil {
		panic(err)
	}
	if has {
		return &ret
	}
	return nil
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
			ScoreCount:        200,
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

func (targetMember *Member) UnbindGoogleAccount() {
	targetMember.GoogleAccount = ""
	_, err := adapter.engine.Id(targetMember.Id).Cols("google_account").Update(targetMember)
	if err != nil {
		panic(err)
	}
}

func (targetMember *Member) UnbindGithubAccount() {
	targetMember.GithubAccount = ""
	_, err := adapter.engine.Id(targetMember.Id).Cols("github_account").Update(targetMember)
	if err != nil {
		panic(err)
	}
}

func (targetMember *Member) UnbindWechatAccount() {
	targetMember.WechatAccount = ""
	targetMember.WechatOpenId = ""
	targetMember.WechatVerifiedTime = ""
	_, err := adapter.engine.Id(targetMember.Id).Cols("wechat_account, wechat_open_id, wechat_verified_time").Update(targetMember)
	if err != nil {
		panic(err)
	}
}

func (targetMember *Member) UnbindQQAccount() {
	targetMember.QQAccount = ""
	targetMember.QQOpenId = ""
	targetMember.QQVerifiedTime = ""
	_, err := adapter.engine.Id(targetMember.Id).Cols("qq_account, qq_open_id, qq_verified_time").Update(targetMember)
	if err != nil {
		panic(err)
	}
}
