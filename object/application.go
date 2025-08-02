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

	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Application struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"varchar(255)" json:"description"`
	Template    string `xorm:"varchar(100)" json:"template"` // Reference to Template.Name
	Parameters  string `xorm:"mediumtext" json:"parameters"`
	Status      string `xorm:"varchar(50)" json:"status"`     // Running, Pending, Failed, Not Deployed
	Namespace   string `xorm:"varchar(100)" json:"namespace"` // Kubernetes namespace (auto-generated)
}

func GetApplications(owner string) ([]*Application, error) {
	applications := []*Application{}
	err := adapter.engine.Desc("created_time").Find(&applications, &Application{Owner: owner})
	if err != nil {
		return applications, err
	}
	return applications, nil
}

func GetApplicationCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Application{})
}

func GetPaginationApplications(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Application, error) {
	applications := []*Application{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&applications)
	if err != nil {
		return applications, err
	}

	return applications, nil
}

func getApplication(owner, name string) (*Application, error) {
	application := Application{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&application)
	if err != nil {
		return &application, err
	}

	if existed {
		return &application, nil
	} else {
		return nil, nil
	}
}

func GetApplication(id string) (*Application, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getApplication(owner, name)
}

func UpdateApplication(id string, application *Application) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	application.UpdatedTime = util.GetCurrentTime()
	_, err := getApplication(owner, name)
	if err != nil {
		return false, err
	}
	if application == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(application)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddApplication(application *Application) (bool, error) {
	if application.CreatedTime == "" {
		application.CreatedTime = util.GetCurrentTime()
	}
	if application.UpdatedTime == "" {
		application.UpdatedTime = util.GetCurrentTime()
	}

	// Generate namespace name based on application owner and name
	application.Namespace = fmt.Sprintf(NamespaceFormat, strings.ReplaceAll(application.Name, "_", "-"))

	// Set initial status
	if application.Status == "" {
		application.Status = StatusNotDeployed
	}

	affected, err := adapter.engine.Insert(application)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteApplication(application *Application) (bool, error) {
	owner, name := application.Owner, application.Name
	// First, delete the deployment if it exists
	go func() {
		_, err := UndeployApplication(owner, name)
		if err != nil {
			return
		}
	}()

	// Then delete the application record
	affected, err := adapter.engine.ID(core.PK{owner, name}).Delete(&Application{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}
