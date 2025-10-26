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
	"github.com/alibabacloud-go/tea/tea"
	util2 "github.com/alibabacloud-go/tea-utils/v2/service"
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
