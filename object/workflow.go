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

	"github.com/casibase/casibase/bpmn"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Workflow struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Text             string `xorm:"mediumtext" json:"text"`
	Text2            string `xorm:"mediumtext" json:"text2"`
	Message          string `xorm:"mediumtext" json:"message"`
	QuestionTemplate string `xorm:"mediumtext" json:"questionTemplate"`
}

func GetMaskedWorkflow(workflow *Workflow, isMaskEnabled bool) *Workflow {
	if !isMaskEnabled {
		return workflow
	}

	if workflow == nil {
		return nil
	}

	return workflow
}

func GetMaskedWorkflows(workflows []*Workflow, isMaskEnabled bool) []*Workflow {
	if !isMaskEnabled {
		return workflows
	}

	for _, workflow := range workflows {
		workflow = GetMaskedWorkflow(workflow, isMaskEnabled)
	}
	return workflows
}

func GetGlobalWorkflows() ([]*Workflow, error) {
	workflows := []*Workflow{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&workflows)
	if err != nil {
		return workflows, err
	}

	return workflows, nil
}

func GetWorkflows(owner string) ([]*Workflow, error) {
	workflows := []*Workflow{}
	err := adapter.engine.Desc("created_time").Find(&workflows, &Workflow{Owner: owner})
	if err != nil {
		return workflows, err
	}

	return workflows, nil
}

func getWorkflow(owner string, name string) (*Workflow, error) {
	workflow := Workflow{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&workflow)
	if err != nil {
		return &workflow, err
	}

	if existed {
		return &workflow, nil
	} else {
		return nil, nil
	}
}

func GetWorkflow(id string) (*Workflow, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getWorkflow(owner, name)
}

func UpdateWorkflow(id string, workflow *Workflow) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getWorkflow(owner, name)
	if err != nil {
		return false, err
	}
	if workflow == nil {
		return false, nil
	}

	if workflow.Text != "" && workflow.Text2 != "" {
		message := bpmn.ComparePath(workflow.Text, workflow.Text2)
		workflow.Message = message
	} else {
		workflow.Message = ""
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(workflow)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddWorkflow(workflow *Workflow) (bool, error) {
	if workflow.Text != "" && workflow.Text2 != "" {
		message := bpmn.ComparePath(workflow.Text, workflow.Text2)
		workflow.Message = message
	} else {
		workflow.Message = ""
	}

	affected, err := adapter.engine.Insert(workflow)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteWorkflow(workflow *Workflow) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{workflow.Owner, workflow.Name}).Delete(&Workflow{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (workflow *Workflow) GetId() string {
	return fmt.Sprintf("%s/%s", workflow.Owner, workflow.Name)
}

func GetWorkflowCount(owner string, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Workflow{})
}

func GetPaginationWorkflows(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Workflow, error) {
	workflows := []*Workflow{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&workflows)
	if err != nil {
		return workflows, err
	}

	return workflows, nil
}
