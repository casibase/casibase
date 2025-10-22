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

const (
	FileTaskStatusPending    = "Pending"
	FileTaskStatusInProgress = "In Progress"
	FileTaskStatusCompleted  = "Completed"
	FileTaskStatusFailed     = "Failed"
)

type FileTask struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	Store    string `xorm:"varchar(100) index" json:"store"`
	FileKey  string `xorm:"varchar(255) index" json:"fileKey"`
	FileName string `xorm:"varchar(255)" json:"fileName"`
	Status   string `xorm:"varchar(100) index" json:"status"`
	Error    string `xorm:"mediumtext" json:"error"`
}

func GetGlobalFileTasks() ([]*FileTask, error) {
	fileTasks := []*FileTask{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&fileTasks)
	if err != nil {
		return fileTasks, err
	}

	return fileTasks, nil
}

func GetFileTasks(owner string) ([]*FileTask, error) {
	fileTasks := []*FileTask{}
	err := adapter.engine.Desc("created_time").Find(&fileTasks, &FileTask{Owner: owner})
	if err != nil {
		return fileTasks, err
	}

	return fileTasks, nil
}

func GetPendingFileTasks(limit int) ([]*FileTask, error) {
	fileTasks := []*FileTask{}
	err := adapter.engine.Where("status = ?", FileTaskStatusPending).Limit(limit).Find(&fileTasks)
	if err != nil {
		return fileTasks, err
	}

	return fileTasks, nil
}

func getFileTask(owner string, name string) (*FileTask, error) {
	fileTask := FileTask{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&fileTask)
	if err != nil {
		return &fileTask, err
	}

	if existed {
		return &fileTask, nil
	} else {
		return nil, nil
	}
}

func GetFileTask(id string) (*FileTask, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getFileTask(owner, name)
}

func GetFileTaskByFileKey(store string, fileKey string) (*FileTask, error) {
	fileTask := FileTask{}
	existed, err := adapter.engine.Where("store = ? AND file_key = ?", store, fileKey).Get(&fileTask)
	if err != nil {
		return nil, err
	}

	if existed {
		return &fileTask, nil
	} else {
		return nil, nil
	}
}

func UpdateFileTask(id string, fileTask *FileTask) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getFileTask(owner, name)
	if err != nil {
		return false, err
	}
	if fileTask == nil {
		return false, nil
	}

	fileTask.UpdatedTime = util.GetCurrentTime()
	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(fileTask)
	if err != nil {
		return false, err
	}

	return true, nil
}

func AddFileTask(fileTask *FileTask) (bool, error) {
	affected, err := adapter.engine.Insert(fileTask)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteFileTask(fileTask *FileTask) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{fileTask.Owner, fileTask.Name}).Delete(&FileTask{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (fileTask *FileTask) GetId() string {
	return fmt.Sprintf("%s/%s", fileTask.Owner, fileTask.Name)
}

func GetFileTaskCount(owner string, store string, field string, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	if store != "" {
		return session.Count(&FileTask{Store: store})
	}
	return session.Count(&FileTask{})
}

func GetPaginationFileTasks(owner string, store string, offset, limit int, field, value, sortField, sortOrder string) ([]*FileTask, error) {
	fileTasks := []*FileTask{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	var err error
	if store != "" {
		err = session.Find(&fileTasks, &FileTask{Store: store})
	} else {
		err = session.Find(&fileTasks)
	}
	if err != nil {
		return fileTasks, err
	}

	return fileTasks, nil
}
