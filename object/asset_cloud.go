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

	"github.com/aliyun/alibaba-cloud-sdk-go/services/ecs"
	"github.com/casibase/casibase/util"
)

func getAssetsFromAliyun(owner string, provider *Provider) ([]*Asset, error) {
	assets := []*Asset{}

	client, err := ecs.NewClientWithAccessKey(
		provider.Region,
		provider.ClientId,
		provider.ClientSecret,
	)
	if err != nil {
		return nil, err
	}

	// Get ECS instances
	ecsRequest := ecs.CreateDescribeInstancesRequest()
	ecsRequest.RegionId = provider.Region
	ecsRequest.PageSize = "100"

	ecsResponse, err := client.DescribeInstances(ecsRequest)
	if err != nil {
		return nil, err
	}

	for _, instance := range ecsResponse.Instances.Instance {
		publicIp := ""
		if len(instance.PublicIpAddress.IpAddress) > 0 {
			publicIp = instance.PublicIpAddress.IpAddress[0]
		}

		tagsJson, _ := json.Marshal(instance.Tags.Tag)

		asset := &Asset{
			Owner:        owner,
			Name:         fmt.Sprintf("%s_%s", provider.Name, instance.InstanceId),
			CreatedTime:  util.GetCurrentTime(),
			DisplayName:  instance.InstanceName,
			Provider:     provider.Name,
			ResourceId:   instance.InstanceId,
			ResourceType: "ECS Instance",
			Region:       instance.RegionId,
			Zone:         instance.ZoneId,
			State:        instance.Status,
			IpAddress:    publicIp,
			Size:         instance.InstanceType,
			Description:  instance.Description,
			Tags:         string(tagsJson),
		}
		assets = append(assets, asset)
	}

	// Get VPC resources
	vpcRequest := ecs.CreateDescribeVpcsRequest()
	vpcRequest.RegionId = provider.Region
	vpcRequest.PageSize = "100"

	vpcResponse, err := client.DescribeVpcs(vpcRequest)
	if err == nil {
		for _, vpc := range vpcResponse.Vpcs.Vpc {
			asset := &Asset{
				Owner:        owner,
				Name:         fmt.Sprintf("%s_%s", provider.Name, vpc.VpcId),
				CreatedTime:  util.GetCurrentTime(),
				DisplayName:  vpc.VpcName,
				Provider:     provider.Name,
				ResourceId:   vpc.VpcId,
				ResourceType: "VPC",
				Region:       vpc.RegionId,
				State:        vpc.Status,
				Description:  vpc.Description,
				Tags:         "",
			}
			assets = append(assets, asset)
		}
	}

	// Get Security Groups
	sgRequest := ecs.CreateDescribeSecurityGroupsRequest()
	sgRequest.RegionId = provider.Region
	sgRequest.PageSize = "100"

	sgResponse, err := client.DescribeSecurityGroups(sgRequest)
	if err == nil {
		for _, sg := range sgResponse.SecurityGroups.SecurityGroup {
			tagsJson, _ := json.Marshal(sg.Tags.Tag)

			asset := &Asset{
				Owner:        owner,
				Name:         fmt.Sprintf("%s_%s", provider.Name, sg.SecurityGroupId),
				CreatedTime:  util.GetCurrentTime(),
				DisplayName:  sg.SecurityGroupName,
				Provider:     provider.Name,
				ResourceId:   sg.SecurityGroupId,
				ResourceType: "Security Group",
				Region:       provider.Region,
				State:        "",
				Description:  sg.Description,
				Tags:         string(tagsJson),
			}
			assets = append(assets, asset)
		}
	}

	// Get Disks
	diskRequest := ecs.CreateDescribeDisksRequest()
	diskRequest.RegionId = provider.Region
	diskRequest.PageSize = "100"

	diskResponse, err := client.DescribeDisks(diskRequest)
	if err == nil {
		for _, disk := range diskResponse.Disks.Disk {
			tagsJson, _ := json.Marshal(disk.Tags.Tag)

			asset := &Asset{
				Owner:        owner,
				Name:         fmt.Sprintf("%s_%s", provider.Name, disk.DiskId),
				CreatedTime:  util.GetCurrentTime(),
				DisplayName:  disk.DiskName,
				Provider:     provider.Name,
				ResourceId:   disk.DiskId,
				ResourceType: "Disk",
				Region:       disk.RegionId,
				Zone:         disk.ZoneId,
				State:        disk.Status,
				Size:         fmt.Sprintf("%d GB", disk.Size),
				Description:  disk.Description,
				Tags:         string(tagsJson),
			}
			assets = append(assets, asset)
		}
	}

	return assets, nil
}

func getAssetsCloud(owner string, providerName string) ([]*Asset, error) {
	assets := []*Asset{}

	if providerName == "" {
		return assets, fmt.Errorf("provider name is required")
	}

	provider, err := getProvider("admin", providerName)
	if err != nil {
		return nil, err
	}

	if provider == nil {
		return nil, fmt.Errorf("provider not found: %s", providerName)
	}

	if provider.Type == "Aliyun" {
		return getAssetsFromAliyun(owner, provider)
	}

	return assets, fmt.Errorf("unsupported provider type: %s", provider.Type)
}

func SyncAssetsCloud(owner string, providerName string) (bool, error) {
	assets, err := getAssetsCloud(owner, providerName)
	if err != nil {
		return false, err
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

	if len(assets) == 0 {
		return false, nil
	}

	affected, err := addAssets(assets)
	return affected, err
}
