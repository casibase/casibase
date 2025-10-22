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

	"xorm.io/core"
)

type FileData struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Store       string `xorm:"varchar(100) notnull pk index" json:"store"`
	Key         string `xorm:"varchar(500) notnull pk" json:"key"`
	Title       string `xorm:"varchar(255)" json:"title"`
	Size        int64  `json:"size"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	IsLeaf      bool   `json:"isLeaf"`
	Url         string `xorm:"varchar(500)" json:"url"`
	Status      string `xorm:"varchar(100)" json:"status"`
	ParentKey   string `xorm:"varchar(500) index" json:"parentKey"`
}

func (fd *FileData) GetId() string {
	return fmt.Sprintf("%s/%s/%s", fd.Owner, fd.Store, fd.Key)
}

func GetFileData(owner string, store string, key string) (*FileData, error) {
	fileData := FileData{Owner: owner, Store: store, Key: key}
	existed, err := adapter.engine.Get(&fileData)
	if err != nil {
		return nil, err
	}

	if existed {
		return &fileData, nil
	}
	return nil, nil
}

func GetFileDataByStore(owner string, store string) ([]*FileData, error) {
	fileDataList := []*FileData{}
	err := adapter.engine.Where("owner = ? AND store = ?", owner, store).Find(&fileDataList)
	if err != nil {
		return nil, err
	}

	return fileDataList, nil
}

func AddFileData(fileData *FileData) (bool, error) {
	affected, err := adapter.engine.Insert(fileData)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func UpdateFileData(owner string, store string, key string, fileData *FileData) (bool, error) {
	if fileData == nil {
		return false, nil
	}

	_, err := adapter.engine.ID(core.PK{owner, store, key}).AllCols().Update(fileData)
	if err != nil {
		return false, err
	}

	return true, nil
}

func DeleteFileData(owner string, store string, key string) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{owner, store, key}).Delete(&FileData{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFileDataByPrefix(owner string, store string, keyPrefix string) (int64, error) {
	affected, err := adapter.engine.Where("owner = ? AND store = ? AND `key` LIKE ?", owner, store, keyPrefix+"%").Delete(&FileData{})
	if err != nil {
		return 0, err
	}

	return affected, nil
}

func CountFileDataByStore(owner string, store string) (int64, error) {
	count, err := adapter.engine.Where("owner = ? AND store = ?", owner, store).Count(&FileData{})
	if err != nil {
		return 0, err
	}

	return count, nil
}
