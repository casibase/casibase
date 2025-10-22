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

type Consultation struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	PatientName string   `xorm:"varchar(100)" json:"patientName"`
	DoctorNames []string `xorm:"mediumtext" json:"doctorNames"`
	ExpiredTime string   `xorm:"varchar(100)" json:"expiredTime"`
	State       string   `xorm:"varchar(100)" json:"state"`
}

func GetConsultationCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Consultation{})
}

func GetConsultations(owner string) ([]*Consultation, error) {
	consultations := []*Consultation{}
	err := adapter.engine.Desc("created_time").Find(&consultations, &Consultation{Owner: owner})
	if err != nil {
		return consultations, err
	}

	return consultations, nil
}

func GetPaginationConsultations(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Consultation, error) {
	consultations := []*Consultation{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&consultations)
	if err != nil {
		return consultations, err
	}

	return consultations, nil
}

func getConsultation(owner string, name string) (*Consultation, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	consultation := Consultation{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&consultation)
	if err != nil {
		return &consultation, err
	}

	if existed {
		return &consultation, nil
	} else {
		return nil, nil
	}
}

func GetConsultation(id string) (*Consultation, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getConsultation(owner, name)
}

func GetMaskedConsultation(consultation *Consultation, errs ...error) (*Consultation, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if consultation == nil {
		return nil, nil
	}

	return consultation, nil
}

func GetMaskedConsultations(consultations []*Consultation, errs ...error) ([]*Consultation, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, consultation := range consultations {
		consultation, err = GetMaskedConsultation(consultation)
		if err != nil {
			return nil, err
		}
	}

	return consultations, nil
}

func UpdateConsultation(id string, consultation *Consultation) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getConsultation(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(consultation)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddConsultation(consultation *Consultation) (bool, error) {
	affected, err := adapter.engine.Insert(consultation)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteConsultation(consultation *Consultation) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{consultation.Owner, consultation.Name}).Delete(&Consultation{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (consultation *Consultation) getId() string {
	return fmt.Sprintf("%s/%s", consultation.Owner, consultation.Name)
}
