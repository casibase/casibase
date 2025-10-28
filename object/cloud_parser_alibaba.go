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

// AlibabaCloudParser implements CloudParser for Alibaba Cloud
type AlibabaCloudParser struct{}

// ScanAssets scans all resources from Alibaba Cloud
func (p *AlibabaCloudParser) ScanAssets(owner string, provider *Provider) ([]*Asset, error) {
	client, err := p.createClient(provider)
	if err != nil {
		return nil, err
	}

	var assets []*Asset
	var nextToken *string

	// Call SearchResources API without ResourceType filter to get all resources across all types
	for {
		var filter []*resourcecenter20221201.SearchResourcesRequestFilter

		// Add region filter if specified
		if provider.Region != "" {
			filter = append(filter, &resourcecenter20221201.SearchResourcesRequestFilter{
				Key:       tea.String("RegionId"),
				MatchType: tea.String("Equals"),
				Value:     []*string{tea.String(provider.Region)},
			})
		}

		request := &resourcecenter20221201.SearchResourcesRequest{
			MaxResults: tea.Int32(100),
			NextToken:  nextToken,
		}

		// Only set Filter if we have region filter, otherwise leave it nil to get all resources
		if len(filter) > 0 {
			request.Filter = filter
		}

		response, err := client.SearchResourcesWithOptions(request, &util2.RuntimeOptions{})
		if err != nil {
			return nil, err
		}

		if response.Body.Resources != nil {
			for _, resource := range response.Body.Resources {
				asset := p.convertResourceToAsset(owner, provider, resource)
				assets = append(assets, asset)
			}
		}

		// Check if there are more pages
		if response.Body.NextToken == nil || tea.StringValue(response.Body.NextToken) == "" {
			break
		}
		nextToken = response.Body.NextToken
	}

	// Enrich assets with detailed information from 2nd level APIs
	err = p.enrichAssetsWithDetailedInfo(provider, assets)
	if err != nil {
		return nil, err
	}

	return assets, nil
}

// createClient creates an Alibaba Cloud Resource Center client
func (p *AlibabaCloudParser) createClient(provider *Provider) (*resourcecenter20221201.Client, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(provider.ClientId),
		AccessKeySecret: tea.String(provider.ClientSecret),
		Endpoint:        tea.String("resourcecenter.aliyuncs.com"),
	}
	return resourcecenter20221201.NewClient(config)
}

// convertResourceToAsset converts an Alibaba Cloud resource to an Asset
func (p *AlibabaCloudParser) convertResourceToAsset(owner string, provider *Provider, resource *resourcecenter20221201.SearchResourcesResponseBodyResources) *Asset {
	// Extract resource type from the resource object
	resourceType := tea.StringValue(resource.ResourceType)

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
		// Fallback to empty JSON object if marshaling fails.
		// While unlikely, this could happen if the API returns unexpected data types
		// in IpAddresses or other fields that don't serialize well to JSON.
		// We handle it gracefully to avoid breaking the entire scan.
		propertiesJson = []byte("{}")
	}

	// Extract tags
	tag := ""
	if resource.Tags != nil {
		for _, t := range resource.Tags {
			tag += fmt.Sprintf("%s=%s,", tea.StringValue(t.Key), tea.StringValue(t.Value))
		}
	}

	// Convert resource type to display name
	displayResourceType := p.getDisplayResourceType(resourceType)

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

// getDisplayResourceType converts an ACS resource type to a user-friendly display name
func (p *AlibabaCloudParser) getDisplayResourceType(resourceType string) string {
	// Map of known resource types to display names
	displayNames := map[string]string{
		"ACS::ECS::Instance":               "ECS Instance",
		"ACS::ECS::Disk":                   "Disk",
		"ACS::ECS::SecurityGroup":          "Security Group",
		"ACS::ECS::Snapshot":               "Snapshot",
		"ACS::ECS::Image":                  "Image",
		"ACS::ECS::NetworkInterface":       "Network Interface",
		"ACS::ECS::KeyPair":                "Key Pair",
		"ACS::ECS::LaunchTemplate":         "Launch Template",
		"ACS::VPC::VPC":                    "VPC",
		"ACS::VPC::VSwitch":                "VSwitch",
		"ACS::VPC::RouteTable":             "Route Table",
		"ACS::VPC::EIP":                    "Elastic IP",
		"ACS::VPC::NatGateway":             "NAT Gateway",
		"ACS::VPC::VpnGateway":             "VPN Gateway",
		"ACS::VPC::CustomerGateway":        "Customer Gateway",
		"ACS::VPC::VpnConnection":          "VPN Connection",
		"ACS::VPC::CommonBandwidthPackage": "Bandwidth Package",
		"ACS::SLB::LoadBalancer":           "Load Balancer",
		"ACS::ALB::LoadBalancer":           "Application Load Balancer",
		"ACS::NLB::LoadBalancer":           "Network Load Balancer",
		"ACS::CS::Cluster":                 "Container Service Cluster",
		"ACS::ACK::Cluster":                "ACK Cluster",
		"ACS::ASK::Cluster":                "ASK Cluster",
		"ACS::RDS::DBInstance":             "RDS Instance",
		"ACS::Redis::DBInstance":           "Redis Instance",
		"ACS::MongoDB::DBInstance":         "MongoDB Instance",
		"ACS::PolarDB::DBCluster":          "PolarDB Cluster",
		"ACS::OSS::Bucket":                 "OSS Bucket",
		"ACS::NAS::FileSystem":             "NAS File System",
		"ACS::CDN::Domain":                 "CDN Domain",
		"ACS::RAM::User":                   "RAM User",
		"ACS::RAM::Role":                   "RAM Role",
		"ACS::KMS::Key":                    "KMS Key",
		"ACS::FC::Function":                "Function Compute",
	}

	if displayName, ok := displayNames[resourceType]; ok {
		return displayName
	}

	// If no mapping found, return the resource type as-is
	return resourceType
}

// enrichAssetsWithDetailedInfo calls 2nd level APIs to get detailed information for assets
func (p *AlibabaCloudParser) enrichAssetsWithDetailedInfo(provider *Provider, assets []*Asset) error {
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

	// Only call 2nd level APIs if there are assets of that type
	if len(ecsAssets) > 0 || len(diskAssets) > 0 || len(vpcAssets) > 0 {
		ecsClient, err := p.createEcsClient(provider)
		if err != nil {
			return err
		}

		if len(ecsAssets) > 0 {
			if err := p.enrichEcsInstances(ecsClient, ecsAssets); err != nil {
				return err
			}
		}

		if len(diskAssets) > 0 {
			if err := p.enrichDisks(ecsClient, diskAssets); err != nil {
				return err
			}
		}

		if len(vpcAssets) > 0 {
			if err := p.enrichVpcs(ecsClient, vpcAssets); err != nil {
				return err
			}
		}
	}

	return nil
}

// createEcsClient creates an Alibaba Cloud ECS client
func (p *AlibabaCloudParser) createEcsClient(provider *Provider) (*ecs20140526.Client, error) {
	config := &openapi.Config{
		AccessKeyId:     tea.String(provider.ClientId),
		AccessKeySecret: tea.String(provider.ClientSecret),
		RegionId:        tea.String(provider.Region),
		Endpoint:        tea.String("ecs." + provider.Region + ".aliyuncs.com"),
	}
	return ecs20140526.NewClient(config)
}

// enrichEcsInstances enriches ECS instances with detailed information
func (p *AlibabaCloudParser) enrichEcsInstances(client *ecs20140526.Client, assets []*Asset) error {
	// Build a list of instance IDs as a JSON array string
	instanceIds := []string{}
	assetMap := make(map[string]*Asset)
	for _, asset := range assets {
		instanceIds = append(instanceIds, asset.ResourceId)
		assetMap[asset.ResourceId] = asset
	}

	// Convert to JSON array string
	instanceIdsJson, err := json.Marshal(instanceIds)
	if err != nil {
		return err
	}

	// Call DescribeInstances API to get detailed information
	request := &ecs20140526.DescribeInstancesRequest{
		InstanceIds: tea.String(string(instanceIdsJson)),
		PageSize:    tea.Int32(100),
	}

	response, err := client.DescribeInstances(request)
	if err != nil {
		return err
	}

	if response.Body.Instances != nil && response.Body.Instances.Instance != nil {
		for _, instance := range response.Body.Instances.Instance {
			instanceId := tea.StringValue(instance.InstanceId)
			asset, ok := assetMap[instanceId]
			if !ok {
				continue
			}

			// Parse existing properties
			properties := make(map[string]interface{})
			if asset.Properties != "" {
				if err := json.Unmarshal([]byte(asset.Properties), &properties); err != nil {
					// If existing properties are invalid, start with empty map
					properties = make(map[string]interface{})
				}
			}

			// Add detailed ECS information
			properties["instanceType"] = tea.StringValue(instance.InstanceType)
			properties["imageId"] = tea.StringValue(instance.ImageId)
			properties["osName"] = tea.StringValue(instance.OSName)
			properties["cpu"] = tea.Int32Value(instance.Cpu)
			properties["memory"] = tea.Int32Value(instance.Memory)
			properties["instanceChargeType"] = tea.StringValue(instance.InstanceChargeType)

			// Extract public IP
			publicIp := ""
			if instance.EipAddress != nil && tea.StringValue(instance.EipAddress.IpAddress) != "" {
				publicIp = tea.StringValue(instance.EipAddress.IpAddress)
			} else if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
				publicIp = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
			}
			if publicIp != "" {
				properties["publicIp"] = publicIp
			}

			// Extract private IP
			privateIp := ""
			if instance.VpcAttributes != nil && instance.VpcAttributes.PrivateIpAddress != nil && len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
				privateIp = tea.StringValue(instance.VpcAttributes.PrivateIpAddress.IpAddress[0])
			}
			if privateIp != "" {
				properties["privateIp"] = privateIp
			}

			// Update asset state (more accurate from DescribeInstances)
			asset.State = tea.StringValue(instance.Status)

			// Marshal properties back to JSON
			propertiesJson, err := json.Marshal(properties)
			if err != nil {
				// If marshaling fails, keep the existing properties
				continue
			}
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}

// enrichDisks enriches disks with detailed information
func (p *AlibabaCloudParser) enrichDisks(client *ecs20140526.Client, assets []*Asset) error {
	// Build a list of disk IDs as a JSON array string
	diskIds := []string{}
	assetMap := make(map[string]*Asset)
	for _, asset := range assets {
		diskIds = append(diskIds, asset.ResourceId)
		assetMap[asset.ResourceId] = asset
	}

	// Convert to JSON array string
	diskIdsJson, err := json.Marshal(diskIds)
	if err != nil {
		return err
	}

	// Call DescribeDisks API to get detailed information
	request := &ecs20140526.DescribeDisksRequest{
		DiskIds:  tea.String(string(diskIdsJson)),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeDisks(request)
	if err != nil {
		return err
	}

	if response.Body.Disks != nil && response.Body.Disks.Disk != nil {
		for _, disk := range response.Body.Disks.Disk {
			diskId := tea.StringValue(disk.DiskId)
			asset, ok := assetMap[diskId]
			if !ok {
				continue
			}

			// Parse existing properties
			properties := make(map[string]interface{})
			if asset.Properties != "" {
				if err := json.Unmarshal([]byte(asset.Properties), &properties); err != nil {
					// If existing properties are invalid, start with empty map
					properties = make(map[string]interface{})
				}
			}

			// Add detailed disk information
			properties["size"] = tea.Int32Value(disk.Size)
			properties["category"] = tea.StringValue(disk.Category)
			properties["type"] = tea.StringValue(disk.Type)
			properties["encrypted"] = tea.BoolValue(disk.Encrypted)
			properties["instanceId"] = tea.StringValue(disk.InstanceId)
			properties["diskChargeType"] = tea.StringValue(disk.DiskChargeType)
			properties["deleteWithInstance"] = tea.BoolValue(disk.DeleteWithInstance)

			// Update asset state (more accurate from DescribeDisks)
			asset.State = tea.StringValue(disk.Status)

			// Marshal properties back to JSON
			propertiesJson, err := json.Marshal(properties)
			if err != nil {
				// If marshaling fails, keep the existing properties
				continue
			}
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}

// enrichVpcs enriches VPCs with detailed information
func (p *AlibabaCloudParser) enrichVpcs(client *ecs20140526.Client, assets []*Asset) error {
	// VPC enrichment needs to be done one by one or in batches
	// since DescribeVpcs API only accepts a single VpcId parameter
	for _, asset := range assets {
		request := &ecs20140526.DescribeVpcsRequest{
			VpcId:    tea.String(asset.ResourceId),
			RegionId: tea.String(asset.Region),
			PageSize: tea.Int32(50),
		}

		response, err := client.DescribeVpcs(request)
		if err != nil {
			// Log error but continue with other VPCs
			continue
		}

		if response.Body.Vpcs != nil && response.Body.Vpcs.Vpc != nil && len(response.Body.Vpcs.Vpc) > 0 {
			vpc := response.Body.Vpcs.Vpc[0]

			// Parse existing properties
			properties := make(map[string]interface{})
			if asset.Properties != "" {
				if err := json.Unmarshal([]byte(asset.Properties), &properties); err != nil {
					// If existing properties are invalid, start with empty map
					properties = make(map[string]interface{})
				}
			}

			// Add detailed VPC information
			properties["cidrBlock"] = tea.StringValue(vpc.CidrBlock)
			properties["vRouterId"] = tea.StringValue(vpc.VRouterId)
			properties["isDefault"] = tea.BoolValue(vpc.IsDefault)
			properties["status"] = tea.StringValue(vpc.Status)
			properties["description"] = tea.StringValue(vpc.Description)

			// Update asset state (more accurate from DescribeVpcs)
			asset.State = tea.StringValue(vpc.Status)

			// Marshal properties back to JSON
			propertiesJson, err := json.Marshal(properties)
			if err != nil {
				// If marshaling fails, keep the existing properties
				continue
			}
			asset.Properties = string(propertiesJson)
		}
	}

	return nil
}
