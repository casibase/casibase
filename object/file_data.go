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

type FileData struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName       string `xorm:"varchar(100)" json:"displayName"`
	Store             string `xorm:"varchar(100) index" json:"store"`
	FileName          string `xorm:"varchar(255)" json:"fileName"`
	FileId            string `xorm:"varchar(100)" json:"fileId"`
	EmbeddingProvider string `xorm:"varchar(100)" json:"embeddingProvider"`
	Status            string `xorm:"varchar(100)" json:"status"`
	TokenCount        int    `json:"tokenCount"`
	Size              int64  `json:"size"`
}

func GetGlobalFilesData() ([]*FileData, error) {
	filesData := []*FileData{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&filesData)
	if err != nil {
		return filesData, err
	}

	return filesData, nil
}

func GetFilesData(owner string) ([]*FileData, error) {
	filesData := []*FileData{}
	err := adapter.engine.Desc("created_time").Find(&filesData, &FileData{Owner: owner})
	if err != nil {
		return filesData, err
	}

	return filesData, nil
}

func getFileData(owner string, name string) (*FileData, error) {
	fileData := FileData{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&fileData)
	if err != nil {
		return &fileData, err
	}

	if existed {
		return &fileData, nil
	} else {
		return nil, nil
	}
}

func GetFileData(id string) (*FileData, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFileData(owner, name)
}

func UpdateFileData(id string, fileData *FileData) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getFileData(owner, name)
	if err != nil {
		return false, err
	}
	if fileData == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(fileData)
	if err != nil {
		return false, err
	}

	return true, nil
}

func AddFileData(fileData *FileData) (bool, error) {
	affected, err := adapter.engine.Insert(fileData)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFileData(fileData *FileData) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{fileData.Owner, fileData.Name}).Delete(&FileData{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (fileData *FileData) GetId() string {
	return fmt.Sprintf("%s/%s", fileData.Owner, fileData.Name)
}

func GetFileDataCount(owner, store, field, value string) (int64, error) {
	session := GetDbSession("", -1, -1, field, value, "", "")
	if store != "" {
		return session.Count(&FileData{Owner: owner, Store: store})
	}
	return session.Count(&FileData{Owner: owner})
}

func GetPaginationFilesData(owner, store string, offset, limit int, field, value, sortField, sortOrder string) ([]*FileData, error) {
	filesData := []*FileData{}
	session := GetDbSession("", offset, limit, field, value, sortField, sortOrder)
	var err error
	if store != "" {
		err = session.Find(&filesData, &FileData{Owner: owner, Store: store})
	} else {
		err = session.Find(&filesData, &FileData{Owner: owner})
	}
	if err != nil {
		return filesData, err
	}

	return filesData, nil
}
