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

type Caase struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Symptoms      string `xorm:"varchar(100)" json:"symptoms"`
	Diagnosis     string `xorm:"varchar(100)" json:"diagnosis"`
	DiagnosisDate string `xorm:"varchar(100)" json:"diagnosisDate"`
	Prescription  string `xorm:"varchar(100)" json:"prescription"`
	FollowUp      string `xorm:"varchar(100)" json:"followUp"`

	Variation                    bool   `xorm:"bool" json:"variation"`
	HISInterfaceInfo             string `xorm:"varchar(100)" json:"hisInterfaceInfo"`
	PrimaryCarePhysician         string `xorm:"varchar(100)" json:"primaryCarePhysician"`
	Type                         string `xorm:"varchar(100)" json:"type"`
	PatientName                  string `xorm:"varchar(100)" json:"patientName"`
	DoctorName                   string `xorm:"varchar(100)" json:"doctorName"`
	HospitalName                 string `xorm:"varchar(100)" json:"hospitalName"`
	SpecialistAllianceId         string `xorm:"varchar(100)" json:"specialistAllianceId"`
	IntegratedCareOrganizationId string `xorm:"varchar(100)" json:"integratedCareOrganizationId"`
}

func GetCaaseCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Caase{})
}

func GetCaases(owner string) ([]*Caase, error) {
	caases := []*Caase{}
	err := adapter.engine.Desc("created_time").Find(&caases, &Caase{Owner: owner})
	if err != nil {
		return caases, err
	}

	return caases, nil
}

func GetPaginationCaases(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Caase, error) {
	caases := []*Caase{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&caases)
	if err != nil {
		return caases, err
	}

	return caases, nil
}

func getCaase(owner string, name string) (*Caase, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	caase := Caase{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&caase)
	if err != nil {
		return &caase, err
	}

	if existed {
		return &caase, nil
	} else {
		return nil, nil
	}
}

func GetCaase(id string) (*Caase, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getCaase(owner, name)
}

func GetMaskedCaase(caase *Caase, errs ...error) (*Caase, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if caase == nil {
		return nil, nil
	}

	return caase, nil
}

func GetMaskedCaases(caases []*Caase, errs ...error) ([]*Caase, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, caase := range caases {
		caase, err = GetMaskedCaase(caase)
		if err != nil {
			return nil, err
		}
	}

	return caases, nil
}

func UpdateCaase(id string, caase *Caase) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getCaase(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(caase)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddCaase(caase *Caase) (bool, error) {
	affected, err := adapter.engine.Insert(caase)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteCaase(caase *Caase) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{caase.Owner, caase.Name}).Delete(&Caase{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (caase *Caase) getId() string {
	return fmt.Sprintf("%s/%s", caase.Owner, caase.Name)
}
