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

type Hospital struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Address string `xorm:"varchar(100)" json:"address"`
}

func GetHospitalCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Hospital{})
}

func GetHospitals(owner string) ([]*Hospital, error) {
	hospitals := []*Hospital{}
	err := adapter.engine.Desc("created_time").Find(&hospitals, &Hospital{Owner: owner})
	if err != nil {
		return hospitals, err
	}

	return hospitals, nil
}

func GetPaginationHospitals(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Hospital, error) {
	hospitals := []*Hospital{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&hospitals)
	if err != nil {
		return hospitals, err
	}

	return hospitals, nil
}

func getHospital(owner string, name string) (*Hospital, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	hospital := Hospital{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&hospital)
	if err != nil {
		return &hospital, err
	}

	if existed {
		return &hospital, nil
	} else {
		return nil, nil
	}
}

func GetHospital(id string) (*Hospital, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getHospital(owner, name)
}

func GetMaskedHospital(hospital *Hospital, errs ...error) (*Hospital, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if hospital == nil {
		return nil, nil
	}

	return hospital, nil
}

func GetMaskedHospitals(hospitals []*Hospital, errs ...error) ([]*Hospital, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, hospital := range hospitals {
		hospital, err = GetMaskedHospital(hospital)
		if err != nil {
			return nil, err
		}
	}

	return hospitals, nil
}

func UpdateHospital(id string, hospital *Hospital) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getHospital(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(hospital)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddHospital(hospital *Hospital) (bool, error) {
	affected, err := adapter.engine.Insert(hospital)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteHospital(hospital *Hospital) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{hospital.Owner, hospital.Name}).Delete(&Hospital{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (hospital *Hospital) getId() string {
	return fmt.Sprintf("%s/%s", hospital.Owner, hospital.Name)
}
