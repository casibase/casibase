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

var CasdoorApplication = beego.AppConfig.String("casdoorApplication")

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

func GetRankingRich() ([]*auth.User, error) {
	users, err := auth.GetUsers()
	if err != nil {
		return nil, err
	}

	sort.SliceStable(users, func(i, j int) bool {
		return users[i].Score > users[j].Score
	})

	users = Limit(users, 0, 25)
	return users, nil
}

// GetMembersAdmin cs, us: 1 means Asc, 2 means Desc, 0 means no effect.
func GetMembersAdmin(cs, us, un string, limit int, offset int) ([]*AdminMemberInfo, int, error) {
	users, err := auth.GetUsers()
	if err != nil {
		return nil, 0, err
	}

	// created time sort
	sort.SliceStable(users, func(i, j int) bool {
		if cs == "1" {
			return users[i].CreatedTime < users[j].CreatedTime
		}
		return users[i].CreatedTime > users[j].CreatedTime
	})

	// id/username sort
	sort.SliceStable(users, func(i, j int) bool {
		if us == "1" {
			return users[i].Id < users[j].Id
		}
		return users[i].Id > users[j].Id
	})

	users = Limit(users, offset, limit)

	var res []*AdminMemberInfo
	count := 0

	// count id like %un%
	for _, user := range users {
		if strings.Contains(user.Id, un) {
			count++

			res = append(res, &AdminMemberInfo{
				User:   *user,
				Status: BoolToInt(user.IsForbidden),
			})
		}
	}

	return res, count, nil
}

func GetMemberAdmin(id string) (*AdminMemberInfo, error) {
	user, err := auth.GetUser(id)
	if err != nil {
		return nil, err
	}

	return &AdminMemberInfo{
		User:          *user,
		FileQuota:     GetUserFieldInt(user, "fileQuota"),
		FileUploadNum: GetFilesNum(id),
		Status:        BoolToInt(user.IsForbidden),
		TopicNum:      GetCreatedTopicsNum(id),
		ReplyNum:      GetMemberRepliesNum(id),
		LatestLogin:   GetUserField(user, "checkinDate"),
		Score:         user.Score,
	}, nil
}

func GetUser(id string) *auth.User {
	user, err := auth.GetUser(id)
	if err != nil {
		panic(err)
	}

	return user
}

func GetUsers() []*auth.User {
	users, err := auth.GetUsers()
	if err != nil {
		panic(err)
	}

	return users
}

func GetMemberAvatar(id string) string {
	user := GetUser(id)
	return user.Avatar
}

func GetMemberNum() int {
	users := GetUsers()
	return len(users)
}

// UpdateMember could update member's file quota and account status.
func UpdateMember(id string, user *auth.User) (bool, error) {
	newUser := GetUser(id)
	if newUser == nil {
		return false, nil
	}

	SetUserFieldInt(newUser, "fileQuota", GetUserFieldInt(user, "fileQuota"))
	SetUserFieldInt(newUser, "status", GetUserFieldInt(user, "status"))
	newUser.Score = user.Score
	return auth.UpdateUser(newUser)
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
	user := GetUser(id)
	if user == nil {
		return ""
	}

	return GetUserField(user, "editorType")
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

// GetMemberEmailReminder return member's email reminder status, and his email address.
func GetMemberEmailReminder(id string) (bool, string) {
	targetMember := GetMemberFromCasdoor(id)
	if targetMember == nil {
		return false, ""
	}

	return targetMember.EmailReminder, targetMember.Email
}

func GetUserByEmail(email string) (*auth.User, error) {
	users, err := auth.GetUsers()
	if err != nil {
		return nil, err
	}

	for _, user := range users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, fmt.Errorf("user not found for Email: %s", email)
}

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

func GetMemberFileQuota(memberId string) int {
	member := GetMemberFromCasdoor(memberId)
	if member == nil {
		return 0
	}

	return member.FileQuota
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

func AddMemberByNameAndEmailIfNotExist(username, email string) (*auth.User, error) {
	username = strings.ReplaceAll(username, " ", "")
	if username == "" {
		return nil, fmt.Errorf("username is empty")
	}

	email = strings.ReplaceAll(email, " ", "")
	if email == "" {
		return nil, fmt.Errorf("email is empty")
	}

	user, err := auth.GetUser(username)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	username = strings.Split(email, "@")[0]
	user, err = auth.GetUser(username)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	newUser, err := GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	score, err := strconv.Atoi(beego.AppConfig.String("initScore"))
	if err != nil {
		panic(err)
	}

	if newUser == nil {
		properties := map[string]string{}
		properties["emailVerifiedTime"] = util.GetCurrentTime()
		properties["fileQuota"] = strconv.Itoa(DefaultUploadFileQuota)
		properties["renameQuota"] = strconv.Itoa(DefaultRenameQuota)

		newUser = &auth.User{
			Name:              username,
			CreatedTime:       util.GetCurrentTime(),
			UpdatedTime:       util.GetCurrentTime(),
			Id:                "",
			Type:              "",
			Password:          "",
			DisplayName:       "",
			Avatar:            UploadFromGravatar(username, email),
			Email:             email,
			Phone:             "",
			Location:          "",
			Address:           nil,
			Affiliation:       "",
			Title:             "",
			Homepage:          "",
			Tag:               "",
			Score:             score,
			Ranking:           GetMemberNum() + 1,
			IsOnline:          false,
			IsAdmin:           false,
			IsGlobalAdmin:     false,
			IsForbidden:       false,
			SignupApplication: CasdoorApplication,
			Properties:        properties,
		}

		_, err = auth.AddUser(newUser)
		if err != nil {
			return newUser, err
		}
	}

	return newUser, nil
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
