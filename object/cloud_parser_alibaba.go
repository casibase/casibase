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
			MaxResults: tea.Int32(500),
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

	// Group assets by resource type to check what types exist
	resourceTypes := make(map[string]bool)
	for _, asset := range assets {
		resourceTypes[asset.ResourceType] = true
	}

	// Create ECS client if needed
	var ecsClient *ecs20140526.Client
	if resourceTypes["ECS Instance"] || resourceTypes["Disk"] || resourceTypes["VPC"] {
		ecsClient, err = p.createEcsClient(provider)
		if err != nil {
			return nil, err
		}
	}

	// Get and merge ECS instance details if ECS instances exist
	if resourceTypes["ECS Instance"] {
		ecsDetails, err := p.getEcsInstances(ecsClient, assets)
		if err != nil {
			return nil, err
		}
		p.mergeEcsDetails(assets, ecsDetails)
	}

	// Get and merge disk details if disks exist
	if resourceTypes["Disk"] {
		diskDetails, err := p.getDisks(ecsClient, assets)
		if err != nil {
			return nil, err
		}
		p.mergeDiskDetails(assets, diskDetails)
	}

	// Get and merge VPC details if VPCs exist
	if resourceTypes["VPC"] {
		vpcDetails, err := p.getVpcs(ecsClient, assets)
		if err != nil {
			return nil, err
		}
		p.mergeVpcDetails(assets, vpcDetails)
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
