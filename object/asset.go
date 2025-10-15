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

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Asset struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`

	Provider    string `xorm:"varchar(100)" json:"provider"`
	DisplayName string `xorm:"varchar(200)" json:"displayName"`
	Type        string `xorm:"varchar(100)" json:"type"`
	ResourceId  string `xorm:"varchar(200)" json:"resourceId"`
	Region      string `xorm:"varchar(100)" json:"region"`
	Zone        string `xorm:"varchar(100)" json:"zone"`
	Status      string `xorm:"varchar(100)" json:"status"`
	
	// Common resource fields
	IpAddress   string `xorm:"varchar(100)" json:"ipAddress"`
	Size        string `xorm:"varchar(100)" json:"size"`
	
	// Additional metadata stored as text
	Metadata    string `xorm:"mediumtext" json:"metadata"`
}

func GetAssetCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
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
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
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

func UpdateAsset(id string, asset *Asset) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	oldAsset, err := getAsset(owner, name)
	if err != nil {
		return false, err
	} else if oldAsset == nil {
		return false, nil
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

func ScanAssetsFromProvider(owner, providerName string, lang string) ([]*Asset, error) {
	provider, err := getProvider(owner, providerName)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to get provider: %v"), err)
	}
	if provider == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:provider not found"))
	}

	var assets []*Asset

	// Scan assets based on provider type
	switch provider.Type {
	case "Aliyun":
		assets, err = scanAliyunAssets(owner, provider, lang)
	default:
		return nil, fmt.Errorf(i18n.Translate(lang, "object:provider type %s is not supported for asset scanning"), provider.Type)
	}

	if err != nil {
		return nil, err
	}

	// Save scanned assets to database
	for _, asset := range assets {
		// Check if asset already exists
		existingAsset, err := getAsset(owner, asset.Name)
		if err != nil {
			return nil, err
		}
		
		if existingAsset != nil {
			// Update existing asset
			_, err = UpdateAsset(util.GetIdFromOwnerAndName(owner, asset.Name), asset)
			if err != nil {
				return nil, err
			}
		} else {
			// Add new asset
			_, err = AddAsset(asset)
			if err != nil {
				return nil, err
			}
		}
	}

	return assets, nil
}

func scanAliyunAssets(owner string, provider *Provider, lang string) ([]*Asset, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(provider.ClientId),
		AccessKeySecret: tea.String(provider.ClientSecret),
		RegionId:        tea.String(provider.Region),
		Endpoint:        tea.String("ecs." + provider.Region + ".aliyuncs.com"),
	}
	client, err := ecs20140526.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to create Aliyun client: %v"), err)
	}

	var assets []*Asset

	// Scan ECS instances
	ecsRequest := &ecs20140526.DescribeInstancesRequest{
		RegionId: tea.String(provider.Region),
	}
	ecsResponse, err := client.DescribeInstances(ecsRequest)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to describe ECS instances: %v"), err)
	}

	if ecsResponse.Body.Instances != nil && ecsResponse.Body.Instances.Instance != nil {
		for _, instance := range ecsResponse.Body.Instances.Instance {
			ipAddress := ""
			if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
				ipAddress = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
			}

			asset := &Asset{
				Owner:       owner,
				Name:        fmt.Sprintf("ecs_%s", tea.StringValue(instance.InstanceId)),
				CreatedTime: util.GetCurrentTime(),
				UpdatedTime: util.GetCurrentTime(),
				Provider:    provider.Name,
				DisplayName: tea.StringValue(instance.InstanceName),
				Type:        "ECS",
				ResourceId:  tea.StringValue(instance.InstanceId),
				Region:      tea.StringValue(instance.RegionId),
				Zone:        tea.StringValue(instance.ZoneId),
				Status:      tea.StringValue(instance.Status),
				IpAddress:   ipAddress,
				Size:        tea.StringValue(instance.InstanceType),
				Metadata:    fmt.Sprintf(`{"osType":"%s","cpu":%d,"memory":%d}`, tea.StringValue(instance.OSType), tea.Int32Value(instance.Cpu), tea.Int32Value(instance.Memory)),
			}
			assets = append(assets, asset)
		}
	}

	// Scan disks
	diskRequest := &ecs20140526.DescribeDisksRequest{
		RegionId: tea.String(provider.Region),
	}
	diskResponse, err := client.DescribeDisks(diskRequest)
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:failed to describe disks: %v"), err)
	}

	if diskResponse.Body.Disks != nil && diskResponse.Body.Disks.Disk != nil {
		for _, disk := range diskResponse.Body.Disks.Disk {
			asset := &Asset{
				Owner:       owner,
				Name:        fmt.Sprintf("disk_%s", tea.StringValue(disk.DiskId)),
				CreatedTime: util.GetCurrentTime(),
				UpdatedTime: util.GetCurrentTime(),
				Provider:    provider.Name,
				DisplayName: tea.StringValue(disk.DiskName),
				Type:        "Disk",
				ResourceId:  tea.StringValue(disk.DiskId),
				Region:      tea.StringValue(disk.RegionId),
				Zone:        tea.StringValue(disk.ZoneId),
				Status:      tea.StringValue(disk.Status),
				Size:        fmt.Sprintf("%dGB", tea.Int32Value(disk.Size)),
				Metadata:    fmt.Sprintf(`{"category":"%s","encrypted":%t}`, tea.StringValue(disk.Category), tea.BoolValue(disk.Encrypted)),
			}
			assets = append(assets, asset)
		}
	}

	return assets, nil
}
