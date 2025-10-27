// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

type File struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Filename        string `xorm:"varchar(255)" json:"filename"`
	Path            string `xorm:"varchar(500)" json:"path"`
	Size            int64  `json:"size"`
	Store           string `xorm:"varchar(100)" json:"store"`
	StorageProvider string `xorm:"varchar(100)" json:"storageProvider"`
	TokenCount      int    `json:"tokenCount"`
	Status          string `xorm:"varchar(100)" json:"status"`
}

func GetGlobalFiles() ([]*File, error) {
	files := []*File{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&files)
	if err != nil {
		return files, err
	}

	return files, nil
}

func GetFiles(owner string) ([]*File, error) {
	files := []*File{}
	err := adapter.engine.Desc("created_time").Find(&files, &File{Owner: owner})
	if err != nil {
		return files, err
	}

	return files, nil
}

func GetFilesByStore(owner string, store string) ([]*File, error) {
	files := []*File{}
	err := adapter.engine.Desc("created_time").Find(&files, &File{Owner: owner, Store: store})
	if err != nil {
		return files, err
	}

	return files, nil
}

func getFile(owner string, name string) (*File, error) {
	file := File{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&file)
	if err != nil {
		return &file, err
	}

	if existed {
		return &file, nil
	} else {
		return nil, nil
	}
}

func GetFile(id string) (*File, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFile(owner, name)
}

func UpdateFile(id string, file *File) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getFile(owner, name)
	if err != nil {
		return false, err
	}
	if file == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(file)
	if err != nil {
		return false, err
	}

	return true, nil
}

func AddFile(file *File) (bool, error) {
	affected, err := adapter.engine.Insert(file)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFile(file *File) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{file.Owner, file.Name}).Delete(&File{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (file *File) GetId() string {
	return fmt.Sprintf("%s/%s", file.Owner, file.Name)
}

func GetFileCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&File{})
}

func GetPaginationFiles(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*File, error) {
	files := []*File{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&files)
	if err != nil {
		return files, err
	}

	return files, nil
}
