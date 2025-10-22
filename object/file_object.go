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

type FileObject struct {
	Owner           string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name            string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime     string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime     string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName     string `xorm:"varchar(100)" json:"displayName"`
	Filename        string `xorm:"varchar(255)" json:"filename"`
	Path            string `xorm:"varchar(500)" json:"path"`
	Size            int64  `json:"size"`
	Store           string `xorm:"varchar(100) index" json:"store"`
	StorageProvider string `xorm:"varchar(100)" json:"storageProvider"`
	TokenCount      int    `json:"tokenCount"`
	Status          string `xorm:"varchar(100)" json:"status"`
}

func GetFileObjectCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&FileObject{})
}

func GetFileObjects(owner string) ([]*FileObject, error) {
	fileObjects := []*FileObject{}
	err := adapter.engine.Desc("created_time").Find(&fileObjects, &FileObject{Owner: owner})
	if err != nil {
		return fileObjects, err
	}

	return fileObjects, nil
}

func GetPaginationFileObjects(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*FileObject, error) {
	fileObjects := []*FileObject{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&fileObjects)
	if err != nil {
		return fileObjects, err
	}

	return fileObjects, nil
}

func getFileObject(owner string, name string) (*FileObject, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	fileObject := FileObject{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&fileObject)
	if err != nil {
		return &fileObject, err
	}

	if existed {
		return &fileObject, nil
	} else {
		return nil, nil
	}
}

func GetFileObject(id string) (*FileObject, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFileObject(owner, name)
}

func GetMaskedFileObject(fileObject *FileObject, errs ...error) (*FileObject, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if fileObject == nil {
		return nil, nil
	}

	return fileObject, nil
}

func GetMaskedFileObjects(fileObjects []*FileObject, errs ...error) ([]*FileObject, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, fileObject := range fileObjects {
		fileObject, err = GetMaskedFileObject(fileObject)
		if err != nil {
			return nil, err
		}
	}

	return fileObjects, nil
}

func UpdateFileObject(id string, fileObject *FileObject) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getFileObject(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(fileObject)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddFileObject(fileObject *FileObject) (bool, error) {
	affected, err := adapter.engine.Insert(fileObject)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFileObject(fileObject *FileObject) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{fileObject.Owner, fileObject.Name}).Delete(&FileObject{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (fileObject *FileObject) getId() string {
	return fmt.Sprintf("%s/%s", fileObject.Owner, fileObject.Name)
}
