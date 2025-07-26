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
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Template struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Description string `xorm:"varchar(255)" json:"description"`
	Version     string `xorm:"varchar(50)" json:"version"`
	Icon        string `xorm:"varchar(255)" json:"icon"`
	Manifests   string `xorm:"mediumtext" json:"manifests"`
}

func GetTemplates(owner string) ([]*Template, error) {
	templates := []*Template{}
	err := adapter.engine.Desc("created_time").Find(&templates, &Template{Owner: owner})
	if err != nil {
		return templates, err
	}
	return templates, nil
}

func GetTemplateCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Template{})
}

func GetPaginationTemplates(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Template, error) {
	templates := []*Template{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&templates)
	if err != nil {
		return templates, err
	}

	return templates, nil
}

func GetTemplate(owner, name string) (*Template, error) {
	template := Template{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&template)
	if err != nil {
		return &template, err
	}

	if existed {
		return &template, nil
	} else {
		return nil, nil
	}
}

func UpdateTemplate(id string, template *Template) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)

	if template.Owner == "" {
		template.Owner = owner
	}
	if template.Name == "" {
		template.Name = name
	}
	template.UpdatedTime = util.GetCurrentTime()

	affected, err := adapter.engine.ID(core.PK{owner, name}).Update(template)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddTemplate(template *Template) (bool, error) {
	if template.CreatedTime == "" {
		template.CreatedTime = util.GetCurrentTime()
	}
	if template.UpdatedTime == "" {
		template.UpdatedTime = util.GetCurrentTime()
	}

	affected, err := adapter.engine.Insert(template)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteTemplate(owner, name string) (bool, error) {
	affected, err := adapter.engine.Delete(&Template{Owner: owner, Name: name})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}
