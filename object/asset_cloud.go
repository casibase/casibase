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
	resourcecenter20221201 "github.com/alibabacloud-go/resourcecenter-20221201/client"
	util2 "github.com/alibabacloud-go/tea-utils/v2/service"
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
		Endpoint:        tea.String("resourcecenter.aliyuncs.com"),
	}
	client, err := resourcecenter20221201.NewClient(config)
	if err != nil {
		return nil, err
	}

	var assets []*Asset

	// Resource types to scan
	resourceTypes := []string{"ACS::ECS::Instance", "ACS::ECS::Disk", "ACS::VPC::VPC"}

	for _, resourceType := range resourceTypes {
		typeAssets, err := scanAliyunResourcesByType(owner, provider, client, resourceType)
		if err != nil {
			return nil, err
		}
		assets = append(assets, typeAssets...)
	}

	// If we have assets, enrich them with detailed information from 2nd level APIs
	if len(assets) > 0 {
		err = enrichAssetsWithDetailedInfo(owner, provider, assets)
		if err != nil {
			return nil, err
		}
	}

	return assets, nil
}

func scanAliyunResourcesByType(owner string, provider *Provider, client *resourcecenter20221201.Client, resourceType string) ([]*Asset, error) {
	var assets []*Asset
	var nextToken *string

	for {
		filter := []*resourcecenter20221201.SearchResourcesRequestFilter{
			{
				Key:       tea.String("ResourceType"),
				MatchType: tea.String("Equals"),
				Value:     []*string{tea.String(resourceType)},
			},
		}

		// Add region filter if specified
		if provider.Region != "" {
			filter = append(filter, &resourcecenter20221201.SearchResourcesRequestFilter{
				Key:       tea.String("RegionId"),
				MatchType: tea.String("Equals"),
				Value:     []*string{tea.String(provider.Region)},
			})
		}

		request := &resourcecenter20221201.SearchResourcesRequest{
			Filter:     filter,
			MaxResults: tea.Int32(100),
			NextToken:  nextToken,
		}

		response, err := client.SearchResourcesWithOptions(request, &util2.RuntimeOptions{})
		if err != nil {
			return nil, err
		}

		if response.Body.Resources != nil {
			for _, resource := range response.Body.Resources {
				asset := convertResourceToAsset(owner, provider, resource, resourceType)
				assets = append(assets, asset)
			}
		}

		// Check if there are more pages
		if response.Body.NextToken == nil || tea.StringValue(response.Body.NextToken) == "" {
			break
		}
		nextToken = response.Body.NextToken
	}

	return assets, nil
}

func convertResourceToAsset(owner string, provider *Provider, resource *resourcecenter20221201.SearchResourcesResponseBodyResources, resourceType string) *Asset {
	// Extract public and private IPs
	publicIp := ""
	privateIp := ""
	if resource.IpAddressAttributes != nil {
		for _, ipAttr := range resource.IpAddressAttributes {
			if tea.StringValue(ipAttr.NetworkType) == "Public" {
				publicIp = tea.StringValue(ipAttr.IpAddress)
			} else if tea.StringValue(ipAttr.NetworkType) == "Private" {
				privateIp = tea.StringValue(ipAttr.IpAddress)
			}
		}
	}

	// Build properties map with available information
	properties := map[string]interface{}{
		"resourceType": resourceType,
	}

	if publicIp != "" {
		properties["publicIp"] = publicIp
	}
	if privateIp != "" {
		properties["privateIp"] = privateIp
	}
	if resource.IpAddresses != nil && len(resource.IpAddresses) > 0 {
		properties["ipAddresses"] = resource.IpAddresses
	}
	if resource.CreateTime != nil {
		properties["createTime"] = tea.StringValue(resource.CreateTime)
	}
	if resource.ExpireTime != nil {
		properties["expireTime"] = tea.StringValue(resource.ExpireTime)
	}
	if resource.ResourceGroupId != nil {
		properties["resourceGroupId"] = tea.StringValue(resource.ResourceGroupId)
	}

	propertiesJson, err := json.Marshal(properties)
	if err != nil {
		// This should rarely happen for simple map types, but handle it anyway
		propertiesJson = []byte("{}")
	}

	// Extract tags
	tag := ""
	if resource.Tags != nil {
		for _, t := range resource.Tags {
			tag += fmt.Sprintf("%s=%s,", tea.StringValue(t.Key), tea.StringValue(t.Value))
		}
	}

	// Determine display resource type
	displayResourceType := ""
	switch resourceType {
	case "ACS::ECS::Instance":
		displayResourceType = "ECS Instance"
	case "ACS::ECS::Disk":
		displayResourceType = "Disk"
	case "ACS::VPC::VPC":
		displayResourceType = "VPC"
	default:
		displayResourceType = resourceType
	}

	asset := &Asset{
		Owner:        owner,
		Name:         util.GenerateId(),
		CreatedTime:  util.GetCurrentTime(),
		UpdatedTime:  util.GetCurrentTime(),
		DisplayName:  tea.StringValue(resource.ResourceName),
		Provider:     provider.Name,
		ResourceId:   tea.StringValue(resource.ResourceId),
		ResourceType: displayResourceType,
		Region:       tea.StringValue(resource.RegionId),
		Zone:         tea.StringValue(resource.ZoneId),
		State:        "", // State is not available in SearchResources API
		Tag:          tag,
		Properties:   string(propertiesJson),
	}

	return asset
}

// enrichAssetsWithDetailedInfo calls 2nd level APIs to get detailed information for assets
func enrichAssetsWithDetailedInfo(owner string, provider *Provider, assets []*Asset) error {
	// Group assets by resource type
	ecsAssets := []*Asset{}
	diskAssets := []*Asset{}
	vpcAssets := []*Asset{}

	for _, asset := range assets {
		switch asset.ResourceType {
		case "ECS Instance":
			ecsAssets = append(ecsAssets, asset)
		case "Disk":
			diskAssets = append(diskAssets, asset)
		case "VPC":
			vpcAssets = append(vpcAssets, asset)
		}
	}

	// Create ECS client for 2nd level API calls
	if len(ecsAssets) > 0 || len(diskAssets) > 0 || len(vpcAssets) > 0 {
		config := &openapi.Config{
			AccessKeyId:     tea.String(provider.ClientId),
			AccessKeySecret: tea.String(provider.ClientSecret),
			RegionId:        tea.String(provider.Region),
			Endpoint:        tea.String("ecs." + provider.Region + ".aliyuncs.com"),
		}
		ecsClient, err := ecs20140526.NewClient(config)
		if err != nil {
			return err
		}

		// Enrich ECS instances
		if len(ecsAssets) > 0 {
			err = enrichEcsInstances(ecsClient, ecsAssets)
			if err != nil {
				return err
			}
		}

		// Enrich Disks
		if len(diskAssets) > 0 {
			err = enrichDisks(ecsClient, diskAssets)
			if err != nil {
				return err
			}
		}

		// Enrich VPCs
		if len(vpcAssets) > 0 {
			err = enrichVpcs(ecsClient, vpcAssets)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// enrichEcsInstances calls DescribeInstances API to get detailed ECS information
func enrichEcsInstances(client *ecs20140526.Client, assets []*Asset) error {
	// Build instance IDs list
	instanceIds := make([]*string, 0, len(assets))
	assetMap := make(map[string]*Asset)
	for _, asset := range assets {
		instanceIds = append(instanceIds, tea.String(asset.ResourceId))
		assetMap[asset.ResourceId] = asset
	}

	// Call DescribeInstances API
	request := &ecs20140526.DescribeInstancesRequest{
		InstanceIds: tea.String(fmt.Sprintf("[\"%s\"]", tea.StringValue(instanceIds[0]))),
		PageSize:    tea.Int32(100),
	}

	// Handle multiple instances in batches if needed
	if len(instanceIds) > 1 {
		instanceIdsJson, _ := json.Marshal(instanceIds)
		request.InstanceIds = tea.String(string(instanceIdsJson))
	}

	response, err := client.DescribeInstances(request)
	if err != nil {
		return err
	}

	// Merge detailed information into assets
	if response.Body.Instances != nil && response.Body.Instances.Instance != nil {
		for _, instance := range response.Body.Instances.Instance {
			instanceId := tea.StringValue(instance.InstanceId)
			asset, exists := assetMap[instanceId]
			if !exists {
				continue
			}

			// Parse existing properties
			var properties map[string]interface{}
			if asset.Properties != "" {
				json.Unmarshal([]byte(asset.Properties), &properties)
			} else {
				properties = make(map[string]interface{})
			}

			// Add detailed properties
			properties["instanceType"] = tea.StringValue(instance.InstanceType)
			properties["imageId"] = tea.StringValue(instance.ImageId)
			properties["osName"] = tea.StringValue(instance.OSName)
			properties["cpu"] = tea.Int32Value(instance.Cpu)
			properties["memory"] = tea.Int32Value(instance.Memory)
			properties["instanceChargeType"] = tea.StringValue(instance.InstanceChargeType)

			// Extract IP addresses
			publicIp := ""
			privateIp := ""
			if instance.EipAddress != nil && tea.StringValue(instance.EipAddress.IpAddress) != "" {
				publicIp = tea.StringValue(instance.EipAddress.IpAddress)
			} else if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
				publicIp = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
			}

			if instance.VpcAttributes != nil && instance.VpcAttributes.PrivateIpAddress != nil && len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
				privateIp = tea.StringValue(instance.VpcAttributes.PrivateIpAddress.IpAddress[0])
			}

			properties["publicIp"] = publicIp
			properties["privateIp"] = privateIp

			// Update asset state (available from detailed API)
			asset.State = tea.StringValue(instance.Status)

			// Serialize properties back to JSON
			propertiesJson, _ := json.Marshal(properties)
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}

// enrichDisks calls DescribeDisks API to get detailed disk information
func enrichDisks(client *ecs20140526.Client, assets []*Asset) error {
	// Build disk IDs list
	diskIds := make([]*string, 0, len(assets))
	assetMap := make(map[string]*Asset)
	for _, asset := range assets {
		diskIds = append(diskIds, tea.String(asset.ResourceId))
		assetMap[asset.ResourceId] = asset
	}

	// Call DescribeDisks API
	request := &ecs20140526.DescribeDisksRequest{
		DiskIds:  tea.String(fmt.Sprintf("[\"%s\"]", tea.StringValue(diskIds[0]))),
		PageSize: tea.Int32(100),
	}

	// Handle multiple disks in batches if needed
	if len(diskIds) > 1 {
		diskIdsJson, _ := json.Marshal(diskIds)
		request.DiskIds = tea.String(string(diskIdsJson))
	}

	response, err := client.DescribeDisks(request)
	if err != nil {
		return err
	}

	// Merge detailed information into assets
	if response.Body.Disks != nil && response.Body.Disks.Disk != nil {
		for _, disk := range response.Body.Disks.Disk {
			diskId := tea.StringValue(disk.DiskId)
			asset, exists := assetMap[diskId]
			if !exists {
				continue
			}

			// Parse existing properties
			var properties map[string]interface{}
			if asset.Properties != "" {
				json.Unmarshal([]byte(asset.Properties), &properties)
			} else {
				properties = make(map[string]interface{})
			}

			// Add detailed properties
			properties["size"] = tea.Int32Value(disk.Size)
			properties["category"] = tea.StringValue(disk.Category)
			properties["type"] = tea.StringValue(disk.Type)
			properties["encrypted"] = tea.BoolValue(disk.Encrypted)
			properties["instanceId"] = tea.StringValue(disk.InstanceId)
			properties["diskChargeType"] = tea.StringValue(disk.DiskChargeType)
			properties["deleteWithInstance"] = tea.BoolValue(disk.DeleteWithInstance)

			// Update asset state (available from detailed API)
			asset.State = tea.StringValue(disk.Status)

			// Serialize properties back to JSON
			propertiesJson, _ := json.Marshal(properties)
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}

// enrichVpcs calls DescribeVpcs API to get detailed VPC information
func enrichVpcs(client *ecs20140526.Client, assets []*Asset) error {
	// Build VPC IDs list
	assetMap := make(map[string]*Asset)
	for _, asset := range assets {
		assetMap[asset.ResourceId] = asset
	}

	// DescribeVpcs API doesn't support querying multiple VPCs by ID list
	// We need to call it once and filter the results
	request := &ecs20140526.DescribeVpcsRequest{
		PageSize: tea.Int32(50),
	}

	response, err := client.DescribeVpcs(request)
	if err != nil {
		return err
	}

	// Merge detailed information into assets
	if response.Body.Vpcs != nil && response.Body.Vpcs.Vpc != nil {
		for _, vpc := range response.Body.Vpcs.Vpc {
			vpcId := tea.StringValue(vpc.VpcId)
			asset, exists := assetMap[vpcId]
			if !exists {
				continue
			}

			// Parse existing properties
			var properties map[string]interface{}
			if asset.Properties != "" {
				json.Unmarshal([]byte(asset.Properties), &properties)
			} else {
				properties = make(map[string]interface{})
			}

			// Add detailed properties
			properties["cidrBlock"] = tea.StringValue(vpc.CidrBlock)
			properties["vRouterId"] = tea.StringValue(vpc.VRouterId)
			properties["isDefault"] = tea.BoolValue(vpc.IsDefault)
			properties["description"] = tea.StringValue(vpc.Description)

			// Update asset state (available from detailed API)
			asset.State = tea.StringValue(vpc.Status)

			// Serialize properties back to JSON
			propertiesJson, _ := json.Marshal(properties)
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}
