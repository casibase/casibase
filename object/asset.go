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

type Asset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(100)" json:"displayName"`

	Category string `xorm:"varchar(100)" json:"category"`
	Type     string `xorm:"varchar(100)" json:"type"`
	Tag      string `xorm:"varchar(100)" json:"tag"`

	MachineName string `xorm:"varchar(100)" json:"machineName"`
	Os          string `xorm:"varchar(100)" json:"os"`

	PublicIp  string `xorm:"varchar(100)" json:"publicIp"`
	PrivateIp string `xorm:"varchar(100)" json:"privateIp"`

	Size    string `xorm:"varchar(100)" json:"size"`
	CpuSize string `xorm:"varchar(100)" json:"cpuSize"`
	MemSize string `xorm:"varchar(100)" json:"memSize"`

	RemoteProtocol string `xorm:"varchar(100)" json:"remoteProtocol"`
	RemotePort     int    `json:"remotePort"`
	RemoteUsername string `xorm:"varchar(100)" json:"remoteUsername"`
	RemotePassword string `xorm:"varchar(100)" json:"remotePassword"`

	AutoQuery   bool `json:"autoQuery"`
	IsPermanent bool `json:"isPermanent"`

	Language string `xorm:"varchar(100)" json:"language"`

	EnableRemoteApp bool         `json:"enableRemoteApp"`
	RemoteApps      []*RemoteApp `json:"remoteApps"`
	Services        []*Service   `json:"services"`
	Patches         []*Patch     `json:"patches"`
}

func GetAssetCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Asset{})
}

func GetAssets(owner string) ([]*Asset, error) {
	assets := []*Asset{}
	err := adapter.engine.Desc("created_time").Find(&assets, &Asset{Owner: owner})
	if err != nil {
		return assets, err
	}

	return assets, nil
}

func GetPaginationAssets(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Asset, error) {
	assets := []*Asset{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&assets)
	if err != nil {
		return assets, err
	}

	return assets, nil
}

func getAsset(owner string, name string) (*Asset, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	asset := Asset{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&asset)
	if err != nil {
		return &asset, err
	}

	if existed {
		return &asset, nil
	} else {
		return nil, nil
	}
}

func GetAsset(id string) (*Asset, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getAsset(owner, name)
}

func GetMaskedAsset(asset *Asset, errs ...error) (*Asset, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	if asset == nil {
		return nil, nil
	}

	if asset.RemotePassword != "" {
		asset.RemotePassword = "***"
	}
	return asset, nil
}

func GetMaskedAssets(assets []*Asset, errs ...error) ([]*Asset, error) {
	if len(errs) > 0 && errs[0] != nil {
		return nil, errs[0]
	}

	var err error
	for _, asset := range assets {
		asset, err = GetMaskedAsset(asset)
		if err != nil {
			return nil, err
		}
	}

	return assets, nil
}

func UpdateAsset(id string, asset *Asset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getAsset(owner, name)
	if err != nil {
		return false, err
	} else if p == nil {
		return false, nil
	}

	if asset.RemotePassword == "***" {
		asset.RemotePassword = p.RemotePassword
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(asset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddAsset(asset *Asset) (bool, error) {
	affected, err := adapter.engine.Insert(asset)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteAsset(asset *Asset) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{asset.Owner, asset.Name}).Delete(&Asset{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (asset *Asset) getId() string {
	return fmt.Sprintf("%s/%s", asset.Owner, asset.Name)
}
