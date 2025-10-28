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
	resourcecenter20221201 "github.com/alibabacloud-go/resourcecenter-20221201/client"
	util2 "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/casibase/casibase/util"
)

// AlibabaCloudParser implements CloudParser for Alibaba Cloud (Aliyun)
type AlibabaCloudParser struct{}

// ScanAssets scans all resources from Alibaba Cloud
func (p *AlibabaCloudParser) ScanAssets(owner string, provider *Provider) ([]*Asset, error) {
	client, err := p.createClient(provider)
	if err != nil {
		return nil, err
	}

	// Get all available resource types
	resourceTypes, err := p.getResourceTypes(client)
	if err != nil {
		return nil, err
	}

	var assets []*Asset

	// Scan each resource type
	for _, resourceType := range resourceTypes {
		typeAssets, err := p.scanResourcesByType(owner, provider, client, resourceType)
		if err != nil {
			// Skip this resource type if scanning fails (e.g., no permission or resource type not available)
			// This allows the scan to continue with other resource types
			continue
		}
		assets = append(assets, typeAssets...)
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

// getResourceTypes retrieves all available resource types from Alibaba Cloud
func (p *AlibabaCloudParser) getResourceTypes(client *resourcecenter20221201.Client) ([]string, error) {
	request := &resourcecenter20221201.GetResourceCountsRequest{}
	response, err := client.GetResourceCountsWithOptions(request, &util2.RuntimeOptions{})

	var resourceTypes []string

	// If API call succeeds, try to extract resource types from response
	if err == nil && response != nil && response.Body != nil && response.Body.Filters != nil {
		for _, filter := range response.Body.Filters {
			if tea.StringValue(filter.Key) == "ResourceType" && filter.Values != nil {
				for _, value := range filter.Values {
					resourceTypes = append(resourceTypes, tea.StringValue(value))
				}
				break
			}
		}
	}

	// If we couldn't get resource types from API (due to error or empty response),
	// use a comprehensive default list
	if len(resourceTypes) == 0 {
		resourceTypes = p.getDefaultResourceTypes()
	}

	return resourceTypes, nil
}

// getDefaultResourceTypes returns a comprehensive list of common Alibaba Cloud resource types
func (p *AlibabaCloudParser) getDefaultResourceTypes() []string {
	return []string{
		// Compute
		"ACS::ECS::Instance",
		"ACS::ECS::Disk",
		"ACS::ECS::SecurityGroup",
		"ACS::ECS::Snapshot",
		"ACS::ECS::Image",
		"ACS::ECS::NetworkInterface",
		"ACS::ECS::KeyPair",
		"ACS::ECS::LaunchTemplate",

		// Networking
		"ACS::VPC::VPC",
		"ACS::VPC::VSwitch",
		"ACS::VPC::RouteTable",
		"ACS::VPC::EIP",
		"ACS::VPC::NatGateway",
		"ACS::VPC::VpnGateway",
		"ACS::VPC::CustomerGateway",
		"ACS::VPC::VpnConnection",
		"ACS::VPC::CommonBandwidthPackage",

		// Load Balancing
		"ACS::SLB::LoadBalancer",
		"ACS::ALB::LoadBalancer",
		"ACS::NLB::LoadBalancer",

		// Container
		"ACS::CS::Cluster",
		"ACS::ACK::Cluster",
		"ACS::ASK::Cluster",

		// Database
		"ACS::RDS::DBInstance",
		"ACS::Redis::DBInstance",
		"ACS::MongoDB::DBInstance",
		"ACS::PolarDB::DBCluster",
		"ACS::DRDS::Instance",
		"ACS::Memcache::Instance",
		"ACS::HBase::Instance",
		"ACS::ClickHouse::DBCluster",

		// Storage
		"ACS::OSS::Bucket",
		"ACS::NAS::FileSystem",
		"ACS::NAS::MountTarget",

		// CDN
		"ACS::CDN::Domain",
		"ACS::DCDN::Domain",

		// DNS
		"ACS::PVTZ::Zone",
		"ACS::DNS::Domain",

		// Security
		"ACS::RAM::User",
		"ACS::RAM::Role",
		"ACS::RAM::Policy",
		"ACS::KMS::Key",
		"ACS::KMS::Secret",

		// Monitoring & Management
		"ACS::CMS::EventRule",
		"ACS::CMS::SiteMonitor",

		// Serverless
		"ACS::FC::Function",
		"ACS::FC::Service",

		// Message Queue
		"ACS::MNS::Queue",
		"ACS::MNS::Topic",
		"ACS::ONS::Topic",
		"ACS::ONS::Group",

		// Big Data
		"ACS::EMR::Cluster",
		"ACS::Elasticsearch::Instance",

		// API Gateway
		"ACS::ApiGateway::Api",
		"ACS::ApiGateway::App",

		// Log Service
		"ACS::SLS::Project",

		// Auto Scaling
		"ACS::ESS::ScalingGroup",
		"ACS::ESS::ScalingConfiguration",
	}
}

// scanResourcesByType scans resources of a specific type
func (p *AlibabaCloudParser) scanResourcesByType(owner string, provider *Provider, client *resourcecenter20221201.Client, resourceType string) ([]*Asset, error) {
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
				asset := p.convertResourceToAsset(owner, provider, resource, resourceType)
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

// convertResourceToAsset converts an Alibaba Cloud resource to an Asset
func (p *AlibabaCloudParser) convertResourceToAsset(owner string, provider *Provider, resource *resourcecenter20221201.SearchResourcesResponseBodyResources, resourceType string) *Asset {
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
