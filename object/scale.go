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

// Scale state values for visibility (which scales are included in public lists).
const (
	ScaleStatePublic = "Public"
	ScaleStateHidden = "Hidden"
)

// Scale is a reusable rubric / evaluation scale (量表), referenced by tasks via Task.Scale (owner/name id).
type Scale struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName string `xorm:"varchar(100)" json:"displayName"`
	Text        string `xorm:"mediumtext" json:"text"`
	State       string `xorm:"varchar(50)" json:"state"`
}

func GetMaskedScale(scale *Scale, isMaskEnabled bool) *Scale {
	if !isMaskEnabled {
		return scale
	}
	if scale == nil {
		return nil
	}
	return scale
}

func GetMaskedScales(scales []*Scale, isMaskEnabled bool) []*Scale {
	if !isMaskEnabled {
		return scales
	}
	for _, s := range scales {
		s = GetMaskedScale(s, isMaskEnabled)
	}
	return scales
}

func GetGlobalScales() ([]*Scale, error) {
	scales := []*Scale{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&scales)
	if err != nil {
		return scales, err
	}
	return scales, nil
}

func GetScales(owner string) ([]*Scale, error) {
	scales := []*Scale{}
	session := adapter.engine.Desc("created_time")
	if owner != "" {
		session = session.Where("owner = ?", owner)
	}
	err := session.Find(&scales)
	if err != nil {
		return scales, err
	}
	return scales, nil
}

// GetPublicScales returns scales visible to non-admins (Public or empty state).
func GetPublicScales(owner string) ([]*Scale, error) {
	scales := []*Scale{}
	session := adapter.engine.Where("owner = ? AND (state = ? OR state = '' OR state IS NULL)", owner, ScaleStatePublic).Desc("created_time")
	err := session.Find(&scales)
	if err != nil {
		return scales, err
	}
	return scales, nil
}

func getScale(owner string, name string) (*Scale, error) {
	s := Scale{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&s)
	if err != nil {
		return &s, err
	}
	if existed {
		return &s, nil
	}
	return nil, nil
}

func GetScale(id string) (*Scale, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, err
	}
	return getScale(owner, name)
}

func UpdateScale(id string, scale *Scale) (bool, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return false, err
	}
	_, err = getScale(owner, name)
	if err != nil {
		return false, err
	}
	if scale == nil {
		return false, nil
	}
	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(scale)
	if err != nil {
		return false, err
	}
	return true, nil
}

func AddScale(scale *Scale) (bool, error) {
	affected, err := adapter.engine.Insert(scale)
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}

func DeleteScale(scale *Scale) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{scale.Owner, scale.Name}).Delete(&Scale{})
	if err != nil {
		return false, err
	}
	return affected != 0, nil
}

func (s *Scale) GetId() string {
	return fmt.Sprintf("%s/%s", s.Owner, s.Name)
}

func GetScaleCount(owner string, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Scale{})
}

func GetPaginationScales(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Scale, error) {
	scales := []*Scale{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&scales)
	if err != nil {
		return scales, err
	}
	return scales, nil
}
