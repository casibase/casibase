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

	"github.com/astaxie/beego"
	"github.com/casbin/casnode/casdoor"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
	"github.com/casdoor/casdoor-go-sdk/auth"
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

func GetRankingRich() ([]*auth.User, error) {
	users := GetUsers()
	sort.SliceStable(users, func(i, j int) bool {
		return users[i].Score > users[j].Score
	})

	users = Limit(users, 0, 25)
	return users, nil
}

func GetUser(id string) *auth.User {
	user := casdoor.GetUser(id)
	return user
}

func GetUsers() []*auth.User {
	users := casdoor.GetUsers()
	return users
}

func GetMemberNum() int {
	users := GetUsers()
	return len(users)
}

func UpdateMemberEditorType(user *auth.User, editorType string) (bool, error) {
	if user == nil {
		return false, fmt.Errorf("user is nil")
	}

	SetUserField(user, "editorType", editorType)
	return auth.UpdateUser(user)
}

func GetMemberEditorType(user *auth.User) string {
	return GetUserField(user, "editorType")
}

func UpdateMemberLanguage(user *auth.User, language string) (bool, error) {
	SetUserField(user, "language", language)
	return auth.UpdateUser(user)
}

func GetMemberLanguage(user *auth.User) string {
	return GetUserField(user, "language")
}

// GetMemberEmailReminder return member's email reminder status, and his email address.
func GetMemberEmailReminder(id string) (bool, string) {
	user := GetUser(id)
	if user == nil {
		return false, ""
	}

	return true, user.Email
}

func GetUserByEmail(email string) (*auth.User, error) {
	users := GetUsers()
	for _, user := range users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, fmt.Errorf("user not found for Email: %s", email)
}

func GetMemberCheckinDate(user *auth.User) string {
	return GetUserField(user, "checkinDate")
}

func UpdateMemberCheckinDate(user *auth.User, checkinDate string) (bool, error) {
	SetUserField(user, "checkinDate", checkinDate)
	return auth.UpdateUser(user)
}

func GetUserName(user *auth.User) string {
	if user == nil {
		return ""
	}

	return user.Name
}

func CheckIsAdmin(user *auth.User) bool {
	if user == nil {
		return false
	}

	return user.IsAdmin
}

func GetMemberFileQuota(user *auth.User) int {
	if user == nil {
		return 0
	}

	return GetUserFieldInt(user, "fileQuota")
}

// UpdateMemberOnlineStatus updates member's online information.
func UpdateMemberOnlineStatus(user *auth.User, isOnline bool, lastActionDate string) (bool, error) {
	if user == nil {
		return false, fmt.Errorf("user is nil")
	}

	user.IsOnline = isOnline
	SetUserField(user, "lastActionDate", lastActionDate)
	return auth.UpdateUser(user)
}

func GetOnlineUserCount() int {
	res := 0

	users := GetUsers()
	for _, user := range users {
		if user.IsOnline {
			res++
		}
	}

	return res
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
