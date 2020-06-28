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
	CreatedTime       string `xorm:"varchar(100)" json:"createdTime"`
	Phone             string `xorm:"varchar(100)" json:"phone"`
	Email             string `xorm:"varchar(100)" json:"email"`
	EmailVerifiedTime string `xorm:"varchar(100)" json:"emailVerifiedTime"`
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
