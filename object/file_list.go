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

type FileList struct {
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

func GetGlobalFileLists() ([]*FileList, error) {
	fileLists := []*FileList{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&fileLists)
	if err != nil {
		return fileLists, err
	}

	return fileLists, nil
}

func GetFileLists(owner string) ([]*FileList, error) {
	fileLists := []*FileList{}
	err := adapter.engine.Desc("created_time").Find(&fileLists, &FileList{Owner: owner})
	if err != nil {
		return fileLists, err
	}

	return fileLists, nil
}

func getFileList(owner string, name string) (*FileList, error) {
	fileList := FileList{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&fileList)
	if err != nil {
		return &fileList, err
	}

	if existed {
		return &fileList, nil
	} else {
		return nil, nil
	}
}

func GetFileList(id string) (*FileList, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFileList(owner, name)
}

func UpdateFileList(id string, fileList *FileList) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getFileList(owner, name)
	if err != nil {
		return false, err
	}
	if fileList == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(fileList)
	if err != nil {
		return false, err
	}

	return true, nil
}

func AddFileList(fileList *FileList) (bool, error) {
	affected, err := adapter.engine.Insert(fileList)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFileList(fileList *FileList) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{fileList.Owner, fileList.Name}).Delete(&FileList{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (fileList *FileList) GetId() string {
	return fmt.Sprintf("%s/%s", fileList.Owner, fileList.Name)
}

func GetFileListCount(owner, store, field, value string) (int64, error) {
	session := GetDbSession("", -1, -1, field, value, "", "")
	if store != "" {
		return session.Count(&FileList{Owner: owner, Store: store})
	}
	return session.Count(&FileList{Owner: owner})
}

func GetPaginationFileLists(owner, store string, offset, limit int, field, value, sortField, sortOrder string) ([]*FileList, error) {
	fileLists := []*FileList{}
	session := GetDbSession("", offset, limit, field, value, sortField, sortOrder)
	var err error
	if store != "" {
		err = session.Find(&fileLists, &FileList{Owner: owner, Store: store})
	} else {
		err = session.Find(&fileLists, &FileList{Owner: owner})
	}
	if err != nil {
		return fileLists, err
	}

	return fileLists, nil
}
