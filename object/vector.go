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

type Vector struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string  `xorm:"varchar(100)" json:"displayName"`
	Store       string  `xorm:"varchar(100)" json:"store"`
	Provider    string  `xorm:"varchar(100) index" json:"provider"`
	File        string  `xorm:"varchar(100)" json:"file"`
	Index       int     `json:"index"`
	Text        string  `xorm:"mediumtext" json:"text"`
	TokenCount  int     `json:"tokenCount"`
	Price       float64 `json:"price"`
	Currency    string  `xorm:"varchar(100)" json:"currency"`
	Score       float32 `json:"score"`

	Data      []float32 `xorm:"mediumtext" json:"data"`
	Dimension int       `json:"dimension"`
}

func GetGlobalVectors() ([]*Vector, error) {
	vectors := []*Vector{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&vectors)
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func GetVectors(owner string) ([]*Vector, error) {
	vectors := []*Vector{}
	err := adapter.engine.Asc("file").Asc("index").Find(&vectors, &Vector{Owner: owner})
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func getVectorsByProvider(storeName string, provider string) ([]*Vector, error) {
	vectors := []*Vector{}
	err := adapter.engine.Find(&vectors, &Vector{Store: storeName, Provider: provider})
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func getVector(owner string, name string) (*Vector, error) {
	vector := Vector{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&vector)
	if err != nil {
		return &vector, err
	}

	if existed {
		return &vector, nil
	} else {
		return nil, nil
	}
}

func getVectorByIndex(owner string, store string, file string, index int) (*Vector, error) {
	vector := Vector{Owner: owner, Store: store, File: file, Index: index}
	existed, err := adapter.engine.Get(&vector)
	if err != nil {
		return &vector, err
	}

	if existed {
		return &vector, nil
	} else {
		return nil, nil
	}
}

func GetVector(id string) (*Vector, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getVector(owner, name)
}

func UpdateVector(id string, vector *Vector) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	oldVector, err := getVector(owner, name)
	if err != nil {
		return false, err
	}
	if vector == nil {
		return false, nil
	}

	if oldVector.Text != vector.Text {
		if vector.Text == "" {
			vector.Data = []float32{}
		} else {
			_, err = refreshVector(vector)
			if err != nil {
				return false, err
			}
		}
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(vector)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddVector(vector *Vector) (bool, error) {
	//err := Index.Add(util.GetId(vector.Owner, vector.Name), vector.Data)
	//if err != nil {
	//	return false, err
	//}

	affected, err := adapter.engine.Insert(vector)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteVector(vector *Vector) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{vector.Owner, vector.Name}).Delete(&Vector{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (vector *Vector) GetId() string {
	return fmt.Sprintf("%s/%s", vector.Owner, vector.Name)
}

func GetVectorCount(owner string, storeName string, field string, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Vector{Store: storeName})
}

func GetPaginationVectors(owner string, storeName string, offset, limit int, field, value, sortField, sortOrder string) ([]*Vector, error) {
	vectors := []*Vector{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	var err error
	if storeName != "" {
		err = session.Find(&vectors, &Vector{Store: storeName})
	} else {
		err = session.Find(&vectors)
	}
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}
