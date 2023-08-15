// Copyright 2023 The casbin Authors. All Rights Reserved.
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

	"github.com/casbin/casibase/util"
	"xorm.io/core"
)

type File struct {
	Key         string  `xorm:"varchar(100)" json:"key"`
	Title       string  `xorm:"varchar(100)" json:"title"`
	Size        int64   `json:"size"`
	CreatedTime string  `xorm:"varchar(100)" json:"createdTime"`
	IsLeaf      bool    `json:"isLeaf"`
	Url         string  `xorm:"varchar(255)" json:"url"`
	Children    []*File `xorm:"varchar(1000)" json:"children"`

	ChildrenMap map[string]*File `xorm:"-" json:"-"`
}

type Properties struct {
	CollectedTime string `xorm:"varchar(100)" json:"collectedTime"`
	Subject       string `xorm:"varchar(100)" json:"subject"`
}

type Store struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	StorageProvider string `xorm:"varchar(100)" json:"storageProvider"`
	ModelProvider   string `xorm:"varchar(100)" json:"modelProvider"`

	FileTree      *File                  `xorm:"mediumtext" json:"fileTree"`
	PropertiesMap map[string]*Properties `xorm:"mediumtext" json:"propertiesMap"`
}

func GetGlobalStores() ([]*Store, error) {
	stores := []*Store{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&stores)
	if err != nil {
		return stores, err
	}

	return stores, nil
}

func GetStores(owner string) ([]*Store, error) {
	stores := []*Store{}
	err := adapter.engine.Desc("created_time").Find(&stores, &Store{Owner: owner})
	if err != nil {
		return stores, err
	}

	return stores, nil
}

func GetDefaultStore(owner string) (*Store, error) {
	stores, err := GetStores(owner)
	if err != nil {
		return nil, err
	}

	for _, store := range stores {
		if store.StorageProvider != "" {
			return store, nil
		}
	}

	if len(stores) > 0 {
		return stores[0], nil
	}

	return nil, nil
}

func getStore(owner string, name string) (*Store, error) {
	store := Store{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&store)
	if err != nil {
		return &store, err
	}

	if existed {
		return &store, nil
	} else {
		return nil, nil
	}
}

func GetStore(id string) (*Store, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getStore(owner, name)
}

func UpdateStore(id string, store *Store) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getStore(owner, name)
	if err != nil {
		return false, err
	}
	if store == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(store)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddStore(store *Store) (bool, error) {
	affected, err := adapter.engine.Insert(store)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteStore(store *Store) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{store.Owner, store.Name}).Delete(&Store{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (store *Store) GetId() string {
	return fmt.Sprintf("%s/%s", store.Owner, store.Name)
}

func RefreshStoreVectors(store *Store) (bool, error) {
	provider, err := getDefaultModelProvider()
	if err != nil {
		return false, err
	}

	authToken := provider.ClientSecret
	success, err := setTxtObjectVector(authToken, store.StorageProvider, "", store.Name)
	if err != nil {
		return false, err
	}
	if !success {
		return false, nil
	}
	return true, nil
}
