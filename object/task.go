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

type Task struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string   `xorm:"varchar(100)" json:"displayName"`
	Provider    string   `xorm:"varchar(100)" json:"provider"`
	Providers   []string `xorm:"mediumtext" json:"providers"`
	Type        string   `xorm:"varchar(100)" json:"type"`

	Subject       string               `xorm:"varchar(100)" json:"subject"`
	Topic         string               `xorm:"varchar(100)" json:"topic"`
	Result        string               `xorm:"varchar(100)" json:"result"`
	Activity      string               `xorm:"varchar(100)" json:"activity"`
	Grade         string               `xorm:"varchar(100)" json:"grade"`
	ModelUsageMap map[string]UsageInfo `xorm:"mediumtext" json:"modelUsageMap"`

	Application string   `xorm:"varchar(100)" json:"application"`
	Path        string   `xorm:"varchar(100)" json:"path"`
	Text        string   `xorm:"mediumtext" json:"text"`
	Example     string   `xorm:"varchar(200)" json:"example"`
	Labels      []string `xorm:"mediumtext" json:"labels"`
	Log         string   `xorm:"mediumtext" json:"log"`
}

func GetMaskedTask(task *Task, isMaskEnabled bool) *Task {
	if !isMaskEnabled {
		return task
	}

	if task == nil {
		return nil
	}

	return task
}

func GetMaskedTasks(tasks []*Task, isMaskEnabled bool) []*Task {
	if !isMaskEnabled {
		return tasks
	}

	for _, task := range tasks {
		task = GetMaskedTask(task, isMaskEnabled)
	}
	return tasks
}

func GetGlobalTasks() ([]*Task, error) {
	tasks := []*Task{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&tasks)
	if err != nil {
		return tasks, err
	}

	return tasks, nil
}

func GetTasks(owner string) ([]*Task, error) {
	tasks := []*Task{}
	err := adapter.engine.Desc("created_time").Find(&tasks, &Task{Owner: owner})
	if err != nil {
		return tasks, err
	}

	return tasks, nil
}

func getTask(owner string, name string) (*Task, error) {
	task := Task{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&task)
	if err != nil {
		return &task, err
	}

	if existed {
		return &task, nil
	} else {
		return nil, nil
	}
}

func GetTask(id string) (*Task, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getTask(owner, name)
}

func UpdateTask(id string, task *Task) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getTask(owner, name)
	if err != nil {
		return false, err
	}
	if task == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(task)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddTask(task *Task) (bool, error) {
	affected, err := adapter.engine.Insert(task)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteTask(task *Task) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{task.Owner, task.Name}).Delete(&Task{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (task *Task) GetId() string {
	return fmt.Sprintf("%s/%s", task.Owner, task.Name)
}

func GetTaskCount(owner string, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Task{})
}

func GetPaginationTasks(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Task, error) {
	tasks := []*Task{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&tasks)
	if err != nil {
		return tasks, err
	}

	return tasks, nil
}
