// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"fmt"

	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Wordset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName   string `xorm:"varchar(100)" json:"displayName"`
	DistanceLimit int    `json:"distanceLimit"`
	Factorset     string `xorm:"varchar(100)" json:"factorset"`

	Factors []*Factor `xorm:"mediumtext" json:"factors"`
}

func GetGlobalWordsets() ([]*Wordset, error) {
	wordsets := []*Wordset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&wordsets)
	if err != nil {
		return wordsets, err
	}

	return wordsets, nil
}

func GetWordsets(owner string) ([]*Wordset, error) {
	wordsets := []*Wordset{}
	err := adapter.engine.Desc("created_time").Find(&wordsets, &Wordset{Owner: owner})
	if err != nil {
		return wordsets, err
	}

	return wordsets, nil
}

func getWordset(owner string, name string) (*Wordset, error) {
	wordset := Wordset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&wordset)
	if err != nil {
		return &wordset, err
	}

	if existed {
		return &wordset, nil
	} else {
		return nil, nil
	}
}

func GetWordset(id string) (*Wordset, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getWordset(owner, name)
}

func UpdateWordset(id string, wordset *Wordset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getWordset(owner, name)
	if err != nil {
		return false, err
	}
	if wordset == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(wordset)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddWordset(wordset *Wordset) (bool, error) {
	affected, err := adapter.engine.Insert(wordset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteWordset(wordset *Wordset) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{wordset.Owner, wordset.Name}).Delete(&Wordset{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (wordset *Wordset) GetId() string {
	return fmt.Sprintf("%s/%s", wordset.Owner, wordset.Name)
}

func GetWordsetCount(owner string, field string, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Wordset{})
}

func GetPaginationWordsets(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Wordset, error) {
	wordsets := []*Wordset{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&wordsets)
	if err != nil {
		return wordsets, err
	}

	return wordsets, nil
}
