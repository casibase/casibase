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
	"encoding/json"
	"fmt"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/casibase/casibase/util"
)

func ScanAssetsFromProvider(owner string, providerName string) (bool, error) {
	provider, err := getProvider(owner, providerName)
	if err != nil {
		return false, err
	}

	if provider == nil {
		return false, fmt.Errorf("provider not found: %s", providerName)
	}

	// Delete existing assets for this provider
	_, err = adapter.engine.Where("owner = ? AND provider = ?", owner, providerName).Delete(&Asset{})
	if err != nil {
		return false, err
	}

	var assets []*Asset

	switch provider.Type {
	case "Aliyun":
		assets, err = scanAliyunAssets(owner, provider)
		if err != nil {
			return false, err
		}
	default:
		return false, fmt.Errorf("unsupported provider type: %s", provider.Type)
	}

	if len(assets) > 0 {
		_, err = addAssets(assets)
		if err != nil {
			return false, err
		}
	}

	return true, nil
}

func scanAliyunAssets(owner string, provider *Provider) ([]*Asset, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(provider.ClientId),
		AccessKeySecret: tea.String(provider.ClientSecret),
		RegionId:        tea.String(provider.Region),
		Endpoint:        tea.String("ecs." + provider.Region + ".aliyuncs.com"),
	}
	client, err := ecs20140526.NewClient(config)
	if err != nil {
		return nil, err
	}

	var assets []*Asset

	// Scan ECS instances
	ecsAssets, err := scanAliyunEcsInstances(owner, provider, client)
	if err != nil {
		return nil, err
	}
	assets = append(assets, ecsAssets...)

	// Scan Disks
	diskAssets, err := scanAliyunDisks(owner, provider, client)
	if err != nil {
		return nil, err
	}
	assets = append(assets, diskAssets...)

	// Scan VPCs
	vpcAssets, err := scanAliyunVpcs(owner, provider, client)
	if err != nil {
		return nil, err
	}
	assets = append(assets, vpcAssets...)

	return assets, nil
}

func scanAliyunEcsInstances(owner string, provider *Provider, client *ecs20140526.Client) ([]*Asset, error) {
	request := &ecs20140526.DescribeInstancesRequest{
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	var assets []*Asset
	if response.Body.Instances != nil && response.Body.Instances.Instance != nil {
		for _, instance := range response.Body.Instances.Instance {
			properties := map[string]interface{}{
				"instanceType":       tea.StringValue(instance.InstanceType),
				"imageId":            tea.StringValue(instance.ImageId),
				"osName":             tea.StringValue(instance.OSName),
				"cpu":                tea.Int32Value(instance.Cpu),
				"memory":             tea.Int32Value(instance.Memory),
				"publicIp":           "",
				"privateIp":          "",
				"instanceChargeType": tea.StringValue(instance.InstanceChargeType),
			}

			if instance.EipAddress != nil && tea.StringValue(instance.EipAddress.IpAddress) != "" {
				properties["publicIp"] = tea.StringValue(instance.EipAddress.IpAddress)
			} else if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
				properties["publicIp"] = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
			}

			if instance.VpcAttributes != nil && instance.VpcAttributes.PrivateIpAddress != nil && len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
				properties["privateIp"] = tea.StringValue(instance.VpcAttributes.PrivateIpAddress.IpAddress[0])
			}

			propertiesJson, _ := json.Marshal(properties)

			tag := ""
			if instance.Tags != nil && instance.Tags.Tag != nil {
				for _, t := range instance.Tags.Tag {
					tag += fmt.Sprintf("%s=%s,", tea.StringValue(t.TagKey), tea.StringValue(t.TagValue))
				}
			}

			asset := &Asset{
				Owner:        owner,
				Name:         util.GenerateId(),
				CreatedTime:  util.GetCurrentTime(),
				UpdatedTime:  util.GetCurrentTime(),
				DisplayName:  tea.StringValue(instance.InstanceName),
				Provider:     provider.Name,
				ResourceId:   tea.StringValue(instance.InstanceId),
				ResourceType: "ECS Instance",
				Region:       tea.StringValue(instance.RegionId),
				Zone:         tea.StringValue(instance.ZoneId),
				State:        tea.StringValue(instance.Status),
				Tag:          tag,
				Properties:   string(propertiesJson),
			}
			assets = append(assets, asset)
		}
	}

	return assets, nil
}

func scanAliyunDisks(owner string, provider *Provider, client *ecs20140526.Client) ([]*Asset, error) {
	request := &ecs20140526.DescribeDisksRequest{
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeDisks(request)
	if err != nil {
		return nil, err
	}

	var assets []*Asset
	if response.Body.Disks != nil && response.Body.Disks.Disk != nil {
		for _, disk := range response.Body.Disks.Disk {
			properties := map[string]interface{}{
				"size":               tea.Int32Value(disk.Size),
				"category":           tea.StringValue(disk.Category),
				"type":               tea.StringValue(disk.Type),
				"encrypted":          tea.BoolValue(disk.Encrypted),
				"instanceId":         tea.StringValue(disk.InstanceId),
				"diskChargeType":     tea.StringValue(disk.DiskChargeType),
				"deleteWithInstance": tea.BoolValue(disk.DeleteWithInstance),
			}

			propertiesJson, _ := json.Marshal(properties)

			tag := ""
			if disk.Tags != nil && disk.Tags.Tag != nil {
				for _, t := range disk.Tags.Tag {
					tag += fmt.Sprintf("%s=%s,", tea.StringValue(t.TagKey), tea.StringValue(t.TagValue))
				}
			}

			asset := &Asset{
				Owner:        owner,
				Name:         util.GenerateId(),
				CreatedTime:  util.GetCurrentTime(),
				UpdatedTime:  util.GetCurrentTime(),
				DisplayName:  tea.StringValue(disk.DiskName),
				Provider:     provider.Name,
				ResourceId:   tea.StringValue(disk.DiskId),
				ResourceType: "Disk",
				Region:       tea.StringValue(disk.RegionId),
				Zone:         tea.StringValue(disk.ZoneId),
				State:        tea.StringValue(disk.Status),
				Tag:          tag,
				Properties:   string(propertiesJson),
			}
			assets = append(assets, asset)
		}
	}

	return assets, nil
}

func scanAliyunVpcs(owner string, provider *Provider, client *ecs20140526.Client) ([]*Asset, error) {
	request := &ecs20140526.DescribeVpcsRequest{
		PageSize: tea.Int32(50),
	}

	response, err := client.DescribeVpcs(request)
	if err != nil {
		return nil, err
	}

	var assets []*Asset
	if response.Body.Vpcs != nil && response.Body.Vpcs.Vpc != nil {
		for _, vpc := range response.Body.Vpcs.Vpc {
			properties := map[string]interface{}{
				"cidrBlock":   tea.StringValue(vpc.CidrBlock),
				"vRouterId":   tea.StringValue(vpc.VRouterId),
				"isDefault":   tea.BoolValue(vpc.IsDefault),
				"status":      tea.StringValue(vpc.Status),
				"description": tea.StringValue(vpc.Description),
			}

			propertiesJson, _ := json.Marshal(properties)

			asset := &Asset{
				Owner:        owner,
				Name:         util.GenerateId(),
				CreatedTime:  util.GetCurrentTime(),
				UpdatedTime:  util.GetCurrentTime(),
				DisplayName:  tea.StringValue(vpc.VpcName),
				Provider:     provider.Name,
				ResourceId:   tea.StringValue(vpc.VpcId),
				ResourceType: "VPC",
				Region:       tea.StringValue(vpc.RegionId),
				Zone:         "",
				State:        tea.StringValue(vpc.Status),
				Tag:          "",
				Properties:   string(propertiesJson),
			}
			assets = append(assets, asset)
		}
	}

	return assets, nil
}
