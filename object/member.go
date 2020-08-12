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

type Member struct {
	Id                string `xorm:"varchar(100) notnull pk" json:"id"`
	Password          string `xorm:"varchar(100) notnull" json:"-"`
	No                int    `json:"no"`
	IsModerator       bool   `xorm:"bool" json:"isModerator"`
	CreatedTime       string `xorm:"varchar(40)" json:"createdTime"`
	Phone             string `xorm:"varchar(100)" json:"phone"`
	PhoneVerifiedTime string `xorm:"varchar(40)" json:"phoneVerifiedTime"`
	Avatar            string `xorm:"varchar(150)" json:"avatar"`
	Email             string `xorm:"varchar(100)" json:"email"`
	EmailVerifiedTime string `xorm:"varchar(40)" json:"emailVerifiedTime"`
	Tagline           string `xorm:"varchar(100)" json:"tagline"`
	Company           string `xorm:"varchar(100)" json:"company"`
	CompanyTitle      string `xorm:"varchar(100)" json:"companyTitle"`
	Ranking           int    `json:"ranking"`
	GoldCount         int    `json:"goldCount"`
	SilverCount       int    `json:"silverCount"`
	BronzeCount       int    `json:"bronzeCount"`
	Bio               string `xorm:"varchar(100)" json:"bio"`
	Website           string `xorm:"varchar(100)" json:"website"`
	Location          string `xorm:"varchar(100)" json:"location"`
	Language          string `xorm:"varchar(10)"  json:"language"`
	FileQuota         int    `xorm:"int" json:"fileQuota"`
	GoogleAccount     string `xorm:"varchar(100)" json:"googleAccount"`
	GithubAccount     string `xorm:"varchar(100)" json:"githubAccount"`
	WeChatAccount     string `xorm:"varchar(100)" json:"weChatAccount"`
	QQAccount         string `xorm:"qq_account varchar(100)" json:"qqAccount"`
	QQOpenId          string `xorm:"qq_open_id varchar(100)" json:"-"`
	QQVerifiedTime    string `xorm:"qq_verified_time varchar(40)" json:"qqVerifiedTime"`
	CheckinDate       string `xorm:"varchar(20)" json:"-"`
}

func GetMembers() []*Member {
	members := []*Member{}
	err := adapter.engine.Asc("created_time").Find(&members)
	if err != nil {
		panic(err)
	}

	return members
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
	existed, err := adapter.engine.Where("id = ?", id).Cols("avatar").Get(&member)
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

func UpdateMember(id string, member *Member) bool {
	if GetMember(id) == nil {
		return false
	}

	_, err := adapter.engine.Id(id).AllCols().Update(member)
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
	existed, err := adapter.engine.Where("id = ?", id).Cols("language").Get(&member)
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

func DeleteMember(id string) bool {
	affected, err := adapter.engine.Id(id).Delete(&Member{})
	if err != nil {
		panic(err)
	}

	return affected != 0
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
	existed, err := adapter.engine.Where("id = ?", id).Cols("checkin_date").Get(&member)
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
	existed, err := adapter.engine.Where("id = ?", memberId).Cols("is_moderator").Get(&member)
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
	existed, err := adapter.engine.Where("id = ?", memberId).Cols("file_quota").Get(&member)
	if err != nil {
		panic(err)
	}

	if existed {
		return member.FileQuota
	} else {
		return 0
	}
}
