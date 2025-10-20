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

type Doctor struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Department  string `xorm:"varchar(100)" json:"department"`
	Gender      string `xorm:"varchar(100)" json:"gender"`
	AccessLevel string `xorm:"varchar(100)" json:"accessLevel"`

	HospitalName string `xorm:"varchar(100) index" json:"hospitalName"`
}

func GetDoctorCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Doctor{})
}

func GetDoctors(owner string) ([]*Doctor, error) {
	doctors := []*Doctor{}
	err := adapter.engine.Desc("created_time").Find(&doctors, &Doctor{Owner: owner})
	if err != nil {
		return doctors, err
	}

	return doctors, nil
}

func GetPaginationDoctors(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Doctor, error) {
	doctors := []*Doctor{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&doctors)
	if err != nil {
		return doctors, err
	}

	return doctors, nil
}

func getDoctor(owner string, name string) (*Doctor, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	doctor := Doctor{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&doctor)
	if err != nil {
		return &doctor, err
	}

	if existed {
		return &doctor, nil
	} else {
		return nil, nil
	}
}

func GetDoctor(id string) (*Doctor, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getDoctor(owner, name)
}

func GetMaskedDoctor(doctor *Doctor, errs ...error) (*Doctor, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if doctor == nil {
		return nil, nil
	}

	return doctor, nil
}

func GetMaskedDoctors(doctors []*Doctor, errs ...error) ([]*Doctor, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, doctor := range doctors {
		doctor, err = GetMaskedDoctor(doctor)
		if err != nil {
			return nil, err
		}
	}

	return doctors, nil
}

func UpdateDoctor(id string, doctor *Doctor) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getDoctor(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(doctor)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddDoctor(doctor *Doctor) (bool, error) {
	affected, err := adapter.engine.Insert(doctor)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteDoctor(doctor *Doctor) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{doctor.Owner, doctor.Name}).Delete(&Doctor{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (doctor *Doctor) getId() string {
	return fmt.Sprintf("%s/%s", doctor.Owner, doctor.Name)
}
