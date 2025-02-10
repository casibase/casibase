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

type Factorset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(500)" json:"displayName"`
	Url         string `xorm:"varchar(100)" json:"url"`
	FileName    string `xorm:"varchar(100)" json:"fileName"`
	FileSize    string `xorm:"varchar(100)" json:"fileSize"`
	Dimension   int    `json:"dimension"`
	Count       int    `json:"count"`

	Factors    []*Factor          `xorm:"mediumtext" json:"factors"`
	AllFactors []*Factor          `xorm:"-" json:"allFactors"`
	FactorMap  map[string]*Factor `xorm:"-" json:"factorMap"`
}

func GetGlobalFactorsets() ([]*Factorset, error) {
	factorsets := []*Factorset{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&factorsets)
	if err != nil {
		return factorsets, err
	}

	return factorsets, nil
}

func GetFactorsets(owner string) ([]*Factorset, error) {
	factorsets := []*Factorset{}
	err := adapter.engine.Desc("created_time").Find(&factorsets, &Factorset{Owner: owner})
	if err != nil {
		return factorsets, err
	}

	return factorsets, nil
}

func getFactorset(owner string, name string) (*Factorset, error) {
	factorset := Factorset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&factorset)
	if err != nil {
		return &factorset, err
	}

	if existed {
		return &factorset, nil
	} else {
		return nil, nil
	}
}

func GetFactorset(id string) (*Factorset, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFactorset(owner, name)
}

func UpdateFactorset(id string, factorset *Factorset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getFactorset(owner, name)
	if err != nil {
		return false, err
	}
	if factorset == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(factorset)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddFactorset(factorset *Factorset) (bool, error) {
	affected, err := adapter.engine.Insert(factorset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFactorset(factorset *Factorset) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{factorset.Owner, factorset.Name}).Delete(&Factorset{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (factorset *Factorset) GetId() string {
	return fmt.Sprintf("%s/%s", factorset.Owner, factorset.Name)
}

func GetFactorsetCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Factorset{})
}

func GetPaginationFactorsets(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Factorset, error) {
	factorsets := []*Factorset{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&factorsets)
	if err != nil {
		return factorsets, err
	}

	return factorsets, nil
}
