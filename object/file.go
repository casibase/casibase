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
	"strings"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type FileStatus string

const (
	FileStatusPending    FileStatus = "Pending"
	FileStatusProcessing FileStatus = "Processing"
	FileStatusFinished   FileStatus = "Finished"
	FileStatusError      FileStatus = "Error"
)

type File struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(512) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	Filename        string     `xorm:"varchar(255)" json:"filename"`
	Size            int64      `json:"size"`
	Store           string     `xorm:"varchar(100)" json:"store"`
	StorageProvider string     `xorm:"varchar(100)" json:"storageProvider"`
	Url             string     `xorm:"varchar(500)" json:"url"`
	TokenCount      int        `json:"tokenCount"`
	Status          FileStatus `xorm:"varchar(100)" json:"status"`
	ErrorText       string     `xorm:"mediumtext" json:"errorText"`
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
	owner, name := util.GetOwnerAndNameFromIdNoCheck(id)
	return getFile(owner, name)
}

func UpdateFile(id string, file *File) (bool, error) {
	owner, name := util.GetOwnerAndNameFromIdNoCheck(id)
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

func DeleteFile(file *File, lang string) (bool, error) {
	var objectKey string
	prefix := fmt.Sprintf("%s_", file.Store)
	if strings.HasPrefix(file.Name, prefix) {
		objectKey = strings.TrimPrefix(file.Name, prefix)
	}
	if objectKey == "" {
		return false, fmt.Errorf(i18n.Translate(lang, "object:The file: %s is not found"), file.Name)
	}

	store, err := getStore(file.Owner, file.Store)
	if err != nil {
		return false, err
	}
	if store == nil {
		return false, fmt.Errorf(i18n.Translate(lang, "account:The store: %s is not found"), file.Store)
	}

	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return false, fmt.Errorf(i18n.Translate(lang, "object:The provider: %s does not exist"), store.StorageProvider)
	}
	err = storageProviderObj.DeleteObject(objectKey)
	if err != nil {
		return false, err
	}

	_, err = DeleteVectorsByFile(file.Owner, file.Store, objectKey)
	if err != nil {
		return false, err
	}

	affected, err := adapter.engine.ID(core.PK{file.Owner, file.Name}).Delete(&File{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (file *File) GetId() string {
	return fmt.Sprintf("%s/%s", file.Owner, file.Name)
}

func getFileName(storeName string, objectKey string) string {
	return fmt.Sprintf("%s_%s", storeName, objectKey)
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

func updateFileStatus(owner string, storeName string, objectKey string, status FileStatus, errorText string, tokenCount int) error {
	name := getFileName(storeName, objectKey)
	cols := []string{"status", "error_text"}
	file := &File{Status: status, ErrorText: errorText}
	if status == FileStatusProcessing {
		cols = append(cols, "token_count")
		file.TokenCount = 0
	} else if status == FileStatusFinished || status == FileStatusError {
		cols = append(cols, "token_count")
		file.TokenCount = tokenCount
	}
	_, err := adapter.engine.ID(core.PK{owner, name}).Cols(cols...).Update(file)
	return err
}

func UpdateFilesStatusByStore(owner string, storeName string, status FileStatus) error {
	_, err := adapter.engine.Where("owner = ? and store = ?", owner, storeName).
		Cols("status", "error_text").Update(&File{Status: status, ErrorText: ""})
	return err
}

func deleteFileRecord(owner string, storeName string, objectKey string) error {
	name := getFileName(storeName, objectKey)
	_, err := adapter.engine.ID(core.PK{owner, name}).Delete(&File{})
	return err
}
