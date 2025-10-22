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

type Patient struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Gender  string `xorm:"varchar(100)" json:"gender"`
	Address string `xorm:"varchar(100)" json:"address"`
	Email   string `xorm:"varchar(100)" json:"email"`

	BloodType    string   `xorm:"varchar(100)" json:"bloodType"`
	Allergies    string   `xorm:"varchar(100)" json:"allergies"`
	Owners       []string `xorm:"mediumtext" json:"owners"`
	HospitalName string   `xorm:"varchar(100)" json:"hospitalName"`
}

func GetPatientCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Patient{})
}

func GetPatients(owner string) ([]*Patient, error) {
	patients := []*Patient{}
	err := adapter.engine.Desc("created_time").Find(&patients, &Patient{Owner: owner})
	if err != nil {
		return patients, err
	}

	return patients, nil
}

func GetPaginationPatients(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Patient, error) {
	patients := []*Patient{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&patients)
	if err != nil {
		return patients, err
	}

	return patients, nil
}

func getPatient(owner string, name string) (*Patient, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	patient := Patient{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&patient)
	if err != nil {
		return &patient, err
	}

	if existed {
		return &patient, nil
	} else {
		return nil, nil
	}
}

func GetPatient(id string) (*Patient, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getPatient(owner, name)
}

func GetMaskedPatient(patient *Patient, errs ...error) (*Patient, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if patient == nil {
		return nil, nil
	}

	return patient, nil
}

func GetMaskedPatients(patients []*Patient, errs ...error) ([]*Patient, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, patient := range patients {
		patient, err = GetMaskedPatient(patient)
		if err != nil {
			return nil, err
		}
	}

	return patients, nil
}

func UpdatePatient(id string, patient *Patient) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getPatient(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(patient)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddPatient(patient *Patient) (bool, error) {
	affected, err := adapter.engine.Insert(patient)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeletePatient(patient *Patient) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{patient.Owner, patient.Name}).Delete(&Patient{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (patient *Patient) getId() string {
	return fmt.Sprintf("%s/%s", patient.Owner, patient.Name)
}
