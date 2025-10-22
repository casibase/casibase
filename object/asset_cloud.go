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
	"time"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
)

func newAliyunEcsClient(accessKeyId string, accessKeySecret string, region string) (*ecs20140526.Client, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(accessKeyId),
		AccessKeySecret: tea.String(accessKeySecret),
		RegionId:        tea.String(region),
		Endpoint:        tea.String("ecs." + region + ".aliyuncs.com"),
	}
	client, err := ecs20140526.NewClient(config)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func scanAliyunEcsInstances(owner string, provider *Provider) ([]*Asset, error) {
	client, err := newAliyunEcsClient(provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return nil, err
	}

	request := &ecs20140526.DescribeInstancesRequest{
		RegionId: tea.String(provider.Region),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	assets := []*Asset{}
	for _, instance := range response.Body.Instances.Instance {
		// Convert tags to JSON string
		tagsMap := make(map[string]string)
		if instance.Tags != nil && instance.Tags.Tag != nil {
			for _, tag := range instance.Tags.Tag {
				tagsMap[tea.StringValue(tag.TagKey)] = tea.StringValue(tag.TagValue)
			}
		}
		tagsJson, _ := json.Marshal(tagsMap)

		// Convert properties to JSON string
		properties := map[string]interface{}{
			"instanceType":   tea.StringValue(instance.InstanceType),
			"cpu":            tea.Int32Value(instance.Cpu),
			"memory":         tea.Int32Value(instance.Memory),
			"osName":         tea.StringValue(instance.OSName),
			"osType":         tea.StringValue(instance.OSType),
			"imageId":        tea.StringValue(instance.ImageId),
			"vpcId":          tea.StringValue(instance.VpcAttributes.VpcId),
			"vSwitchId":      tea.StringValue(instance.VpcAttributes.VSwitchId),
			"publicIpAddress": func() []string {
				if instance.PublicIpAddress != nil && instance.PublicIpAddress.IpAddress != nil {
					ips := make([]string, 0)
					for _, ip := range instance.PublicIpAddress.IpAddress {
						ips = append(ips, tea.StringValue(ip))
					}
					return ips
				}
				return []string{}
			}(),
			"privateIpAddress": func() []string {
				if instance.InnerIpAddress != nil && instance.InnerIpAddress.IpAddress != nil {
					ips := make([]string, 0)
					for _, ip := range instance.InnerIpAddress.IpAddress {
						ips = append(ips, tea.StringValue(ip))
					}
					return ips
				}
				return []string{}
			}(),
		}
		propertiesJson, _ := json.Marshal(properties)

		asset := &Asset{
			Owner:        owner,
			Name:         fmt.Sprintf("ecs-%s", tea.StringValue(instance.InstanceId)),
			CreatedTime:  time.Now().Format(time.RFC3339),
			UpdatedTime:  time.Now().Format(time.RFC3339),
			Provider:     provider.Name,
			ResourceId:   tea.StringValue(instance.InstanceId),
			ResourceType: "ECS Instance",
			ResourceName: tea.StringValue(instance.InstanceName),
			Region:       tea.StringValue(instance.RegionId),
			Zone:         tea.StringValue(instance.ZoneId),
			Status:       tea.StringValue(instance.Status),
			Tags:         string(tagsJson),
			Properties:   string(propertiesJson),
		}
		assets = append(assets, asset)
	}

	return assets, nil
}

func scanAliyunVpcs(owner string, provider *Provider) ([]*Asset, error) {
	client, err := newAliyunEcsClient(provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return nil, err
	}

	request := &ecs20140526.DescribeVpcsRequest{
		RegionId: tea.String(provider.Region),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeVpcs(request)
	if err != nil {
		return nil, err
	}

	assets := []*Asset{}
	for _, vpc := range response.Body.Vpcs.Vpc {
		// Convert tags to JSON string
		tagsMap := make(map[string]string)
		if vpc.Tags != nil && vpc.Tags.Tag != nil {
			for _, tag := range vpc.Tags.Tag {
				tagsMap[tea.StringValue(tag.Key)] = tea.StringValue(tag.Value)
			}
		}
		tagsJson, _ := json.Marshal(tagsMap)

		// Convert properties to JSON string
		properties := map[string]interface{}{
			"cidrBlock":   tea.StringValue(vpc.CidrBlock),
			"vRouterId":   tea.StringValue(vpc.VRouterId),
			"description": tea.StringValue(vpc.Description),
			"isDefault":   tea.BoolValue(vpc.IsDefault),
		}
		propertiesJson, _ := json.Marshal(properties)

		asset := &Asset{
			Owner:        owner,
			Name:         fmt.Sprintf("vpc-%s", tea.StringValue(vpc.VpcId)),
			CreatedTime:  time.Now().Format(time.RFC3339),
			UpdatedTime:  time.Now().Format(time.RFC3339),
			Provider:     provider.Name,
			ResourceId:   tea.StringValue(vpc.VpcId),
			ResourceType: "VPC",
			ResourceName: tea.StringValue(vpc.VpcName),
			Region:       tea.StringValue(vpc.RegionId),
			Zone:         "",
			Status:       tea.StringValue(vpc.Status),
			Tags:         string(tagsJson),
			Properties:   string(propertiesJson),
		}
		assets = append(assets, asset)
	}

	return assets, nil
}

func scanAliyunSecurityGroups(owner string, provider *Provider) ([]*Asset, error) {
	client, err := newAliyunEcsClient(provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return nil, err
	}

	request := &ecs20140526.DescribeSecurityGroupsRequest{
		RegionId: tea.String(provider.Region),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeSecurityGroups(request)
	if err != nil {
		return nil, err
	}

	assets := []*Asset{}
	for _, sg := range response.Body.SecurityGroups.SecurityGroup {
		// Convert tags to JSON string
		tagsMap := make(map[string]string)
		if sg.Tags != nil && sg.Tags.Tag != nil {
			for _, tag := range sg.Tags.Tag {
				tagsMap[tea.StringValue(tag.TagKey)] = tea.StringValue(tag.TagValue)
			}
		}
		tagsJson, _ := json.Marshal(tagsMap)

		// Convert properties to JSON string
		properties := map[string]interface{}{
			"vpcId":         tea.StringValue(sg.VpcId),
			"description":   tea.StringValue(sg.Description),
			"securityGroupType": tea.StringValue(sg.SecurityGroupType),
		}
		propertiesJson, _ := json.Marshal(properties)

		asset := &Asset{
			Owner:        owner,
			Name:         fmt.Sprintf("sg-%s", tea.StringValue(sg.SecurityGroupId)),
			CreatedTime:  time.Now().Format(time.RFC3339),
			UpdatedTime:  time.Now().Format(time.RFC3339),
			Provider:     provider.Name,
			ResourceId:   tea.StringValue(sg.SecurityGroupId),
			ResourceType: "Security Group",
			ResourceName: tea.StringValue(sg.SecurityGroupName),
			Region:       tea.StringValue(sg.RegionId),
			Zone:         "",
			Status:       "Available",
			Tags:         string(tagsJson),
			Properties:   string(propertiesJson),
		}
		assets = append(assets, asset)
	}

	return assets, nil
}

func scanAliyunDisks(owner string, provider *Provider) ([]*Asset, error) {
	client, err := newAliyunEcsClient(provider.ClientId, provider.ClientSecret, provider.Region)
	if err != nil {
		return nil, err
	}

	request := &ecs20140526.DescribeDisksRequest{
		RegionId: tea.String(provider.Region),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeDisks(request)
	if err != nil {
		return nil, err
	}

	assets := []*Asset{}
	for _, disk := range response.Body.Disks.Disk {
		// Convert tags to JSON string
		tagsMap := make(map[string]string)
		if disk.Tags != nil && disk.Tags.Tag != nil {
			for _, tag := range disk.Tags.Tag {
				tagsMap[tea.StringValue(tag.TagKey)] = tea.StringValue(tag.TagValue)
			}
		}
		tagsJson, _ := json.Marshal(tagsMap)

		// Convert properties to JSON string
		properties := map[string]interface{}{
			"diskType":     tea.StringValue(disk.Type),
			"category":     tea.StringValue(disk.Category),
			"size":         tea.Int32Value(disk.Size),
			"instanceId":   tea.StringValue(disk.InstanceId),
			"device":       tea.StringValue(disk.Device),
			"deleteWithInstance": tea.BoolValue(disk.DeleteWithInstance),
		}
		propertiesJson, _ := json.Marshal(properties)

		asset := &Asset{
			Owner:        owner,
			Name:         fmt.Sprintf("disk-%s", tea.StringValue(disk.DiskId)),
			CreatedTime:  time.Now().Format(time.RFC3339),
			UpdatedTime:  time.Now().Format(time.RFC3339),
			Provider:     provider.Name,
			ResourceId:   tea.StringValue(disk.DiskId),
			ResourceType: "Disk",
			ResourceName: tea.StringValue(disk.DiskName),
			Region:       tea.StringValue(disk.RegionId),
			Zone:         tea.StringValue(disk.ZoneId),
			Status:       tea.StringValue(disk.Status),
			Tags:         string(tagsJson),
			Properties:   string(propertiesJson),
		}
		assets = append(assets, asset)
	}

	return assets, nil
}

func ScanAssetsFromCloud(owner string, providerName string) (bool, error) {
	provider, err := getProvider(owner, providerName)
	if err != nil {
		return false, err
	}

	if provider == nil {
		return false, fmt.Errorf("provider %s not found", providerName)
	}

	if provider.Category != "Public Cloud" && provider.Category != "Private Cloud" {
		return false, fmt.Errorf("provider %s is not a cloud provider", providerName)
	}

	var allAssets []*Asset

	// Scan different resource types based on provider type
	if provider.Type == "Aliyun" {
		// Scan ECS instances
		ecsAssets, err := scanAliyunEcsInstances(owner, provider)
		if err != nil {
			return false, fmt.Errorf("failed to scan ECS instances: %v", err)
		}
		allAssets = append(allAssets, ecsAssets...)

		// Scan VPCs
		vpcAssets, err := scanAliyunVpcs(owner, provider)
		if err != nil {
			return false, fmt.Errorf("failed to scan VPCs: %v", err)
		}
		allAssets = append(allAssets, vpcAssets...)

		// Scan Security Groups
		sgAssets, err := scanAliyunSecurityGroups(owner, provider)
		if err != nil {
			return false, fmt.Errorf("failed to scan security groups: %v", err)
		}
		allAssets = append(allAssets, sgAssets...)

		// Scan Disks
		diskAssets, err := scanAliyunDisks(owner, provider)
		if err != nil {
			return false, fmt.Errorf("failed to scan disks: %v", err)
		}
		allAssets = append(allAssets, diskAssets...)
	} else {
		return false, fmt.Errorf("provider type %s is not supported for asset scanning yet", provider.Type)
	}

	// Delete existing assets for this provider
	existingAssets, err := GetAssets(owner)
	if err != nil {
		return false, err
	}

	for _, existingAsset := range existingAssets {
		if existingAsset.Provider == providerName {
			_, err := DeleteAsset(existingAsset)
			if err != nil {
				return false, err
			}
		}
	}

	// Add new assets
	if len(allAssets) > 0 {
		affected, err := addAssets(allAssets)
		if err != nil {
			return false, err
		}
		return affected, nil
	}

	return false, nil
}
