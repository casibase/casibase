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
	"encoding/json"
	"fmt"
	"sort"

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

var vectorCache map[string][]*Vector

func GetGlobalVectors() ([]*Vector, error) {
	vectors, err := getVectorCache(&Vector{})
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func GetVectors(owner string) ([]*Vector, error) {
	vectors, err := getVectorCache(&Vector{Owner: owner})

	sort.Slice(vectors, func(i, j int) bool {
		return vectors[i].File < vectors[j].File
	})

	sort.Slice(vectors, func(i, j int) bool {
		return vectors[i].Index < vectors[j].Index
	})

	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func getVectorsByProvider(provider string) ([]*Vector, error) {
	vectors, err := getVectorCache(&Vector{Provider: provider})
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}

func getVector(owner string, name string) (*Vector, error) {
	vector, existed := getFirstVectorCache(&Vector{Owner: owner, Name: name})
	if existed {
		return vector, nil
	} else {
		return nil, nil
	}
}

func getVectorByIndex(owner string, store string, file string, index int) (*Vector, error) {
	vector, existed := getFirstVectorCache(&Vector{Owner: owner, Store: store, File: file, Index: index})
	if existed {
		return vector, nil
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
	_, err := getVector(owner, name)
	if err != nil {
		return false, err
	}
	if vector == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(vector)
	if err != nil {
		return false, err
	}
	updateVectorCache(owner, name, vector)

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
	if affected != 0 {
		addVectorCache(vector)
	}

	return affected != 0, nil
}

func DeleteVector(vector *Vector) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{vector.Owner, vector.Name}).Delete(&Vector{})
	if err != nil {
		return false, err
	}
	deleteVectorCache(vector)

	return affected != 0, nil
}

func (vector *Vector) GetId() string {
	return fmt.Sprintf("%s/%s", vector.Owner, vector.Name)
}

func (vector *Vector) getVectorCacheKey() (string, error) {
	marshal, err := json.Marshal(vector)
	if err != nil {
		return "", err
	}
	return string(marshal), nil
}

func getVectorCache(vector *Vector) ([]*Vector, error) {
	if vectorCache == nil || vectorCache["all"] == nil || len(vectorCache) == 0 {
		vectorCache = make(map[string][]*Vector)
		err := syncVectorCache("")
		if err != nil {
			return nil, err
		}
	}

	key, err := vector.getVectorCacheKey()
	if err != nil {
		return nil, err
	}

	result := []*Vector{}
	if vectorCache[key] == nil || len(vectorCache) == 0 {
		err := syncSpecialVectorCache(vector)
		if err != nil {
			return nil, err
		}
	}
	result = vectorCache[key]

	return result, nil
}

func getFirstVectorCache(vector *Vector) (*Vector, bool) {
	allVectors := vectorCache["all"]
	for _, v := range allVectors {
		if vector.Owner != "" && vector.Owner != v.Owner {
			continue
		}
		if vector.Name != "" && vector.Name != v.Name {
			continue
		}
		if vector.Store != "" && vector.Store != v.Store {
			continue
		}
		if vector.File != "" && vector.File != v.File {
			continue
		}
		if vector.Index != 0 && vector.Index != v.Index {
			continue
		}
		if vector.Provider != "" && vector.Provider != v.Provider {
			continue
		}
		return v, true
	}
	return nil, false
}

func filterCacheMap() {
	filteredMap := map[string][]*Vector{}
	for key, value := range vectorCache {
		if key == "all" {
			filteredMap[key] = value
		}
	}
	vectorCache = filteredMap
}

func addVectorCache(vector *Vector) {
	filterCacheMap()
	vectorCache["all"] = append(vectorCache["all"], vector)
}

func deleteVectorCache(vector *Vector) {
	filterCacheMap()
	for i, v := range vectorCache["all"] {
		if v.Owner == vector.Owner && v.Name == vector.Name {
			vectorCache["all"] = append(vectorCache["all"][:i], vectorCache["all"][i+1:]...)
			break
		}
	}
}

func updateVectorCache(owner string, name string, vector *Vector) {
	filterCacheMap()
	for i, v := range vectorCache["all"] {
		if v.Owner == owner && v.Name == name {
			vectorCache["all"][i] = vector
			break
		}
	}
}

func syncVectorCache(storeName string) error {
	if vectorCache == nil {
		vectorCache = make(map[string][]*Vector)
	}
	var vectors []*Vector
	var err error
	if storeName == "" {
		err = adapter.engine.Asc("owner").Desc("created_time").Find(&vectors)
	} else {
		err = adapter.engine.Asc("owner").Desc("created_time").Where("store = ?", storeName).Find(&vectors)
	}
	if err != nil {
		return err
	}
	if storeName == "" {
		vectorCache["all"] = vectors
	} else {
		for i := range vectorCache["all"] {
			if vectorCache["all"][i].Store != storeName {
				vectors = append(vectors, vectorCache["all"][i])
			}
		}
		vectorCache["all"] = vectors
	}
	// clear other cache
	filterCacheMap()
	return nil
}

func syncSpecialVectorCache(vector *Vector) error {
	allVectors := vectorCache["all"]
	if allVectors == nil {
		err := syncVectorCache("")
		if err != nil {
			return err
		}
	}

	key, err := vector.getVectorCacheKey()
	if err != nil {
		return err
	}

	for _, v := range allVectors {
		if vector.Owner != "" && vector.Owner != v.Owner {
			continue
		}
		if vector.Name != "" && vector.Name != v.Name {
			continue
		}
		if vector.Store != "" && vector.Store != v.Store {
			continue
		}
		if vector.File != "" && vector.File != v.File {
			continue
		}
		if vector.Index != 0 && vector.Index != v.Index {
			continue
		}
		if vector.Provider != "" && vector.Provider != v.Provider {
			continue
		}
		vectorCache[key] = append(vectorCache[key], v)
	}

	return nil
}

func GetVectorCount(owner string, field string, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Vector{})
}

func GetPaginationVectors(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Vector, error) {
	vectors := []*Vector{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&vectors)
	if err != nil {
		return vectors, err
	}

	return vectors, nil
}
