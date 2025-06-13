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

type FormItem struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Type  string `json:"type"`
	Width string `json:"width"`
}

type Form struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Position    string `xorm:"varchar(100)" json:"position"`

	FormItems []*FormItem `xorm:"varchar(5000)" json:"formItems"`
}

func GetMaskedForm(form *Form, isMaskEnabled bool) *Form {
	if !isMaskEnabled {
		return form
	}

	if form == nil {
		return nil
	}

	return form
}

func GetMaskedForms(forms []*Form, isMaskEnabled bool) []*Form {
	if !isMaskEnabled {
		return forms
	}

	for _, form := range forms {
		form = GetMaskedForm(form, isMaskEnabled)
	}
	return forms
}

func GetGlobalForms() ([]*Form, error) {
	forms := []*Form{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&forms)
	if err != nil {
		return forms, err
	}

	return forms, nil
}

func GetForms(owner string) ([]*Form, error) {
	forms := []*Form{}
	err := adapter.engine.Desc("created_time").Find(&forms, &Form{Owner: owner})
	if err != nil {
		return forms, err
	}

	return forms, nil
}

func getForm(owner string, name string) (*Form, error) {
	form := Form{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&form)
	if err != nil {
		return &form, err
	}

	if existed {
		return &form, nil
	} else {
		return nil, nil
	}
}

func GetForm(id string) (*Form, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getForm(owner, name)
}

func UpdateForm(id string, form *Form) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	_, err := getForm(owner, name)
	if err != nil {
		return false, err
	}
	if form == nil {
		return false, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(form)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddForm(form *Form) (bool, error) {
	affected, err := adapter.engine.Insert(form)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteForm(form *Form) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{form.Owner, form.Name}).Delete(&Form{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (form *Form) GetId() string {
	return fmt.Sprintf("%s/%s", form.Owner, form.Name)
}

func GetFormCount(owner string, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Form{})
}

func GetPaginationForms(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Form, error) {
	forms := []*Form{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&forms)
	if err != nil {
		return forms, err
	}

	return forms, nil
}
