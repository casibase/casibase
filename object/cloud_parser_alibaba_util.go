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

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	ecs20140526 "github.com/alibabacloud-go/ecs-20140526/v4/client"
	"github.com/alibabacloud-go/tea/tea"
)

// EcsInstanceDetail holds detailed information for an ECS instance
type EcsInstanceDetail struct {
	InstanceId         string
	InstanceType       string
	ImageId            string
	OSName             string
	Cpu                int32
	Memory             int32
	PublicIp           string
	PrivateIp          string
	InstanceChargeType string
	Status             string
}

// DiskDetail holds detailed information for a disk
type DiskDetail struct {
	DiskId             string
	Size               int32
	Category           string
	Type               string
	Encrypted          bool
	InstanceId         string
	DiskChargeType     string
	DeleteWithInstance bool
	Status             string
}

// VpcDetail holds detailed information for a VPC
type VpcDetail struct {
	VpcId       string
	CidrBlock   string
	VRouterId   string
	IsDefault   bool
	Status      string
	Description string
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

// getEcsInstances retrieves detailed information for ECS instances
func (p *AlibabaCloudParser) getEcsInstances(client *ecs20140526.Client, assets []*Asset) (map[string]*EcsInstanceDetail, error) {
	// Build a list of instance IDs
	instanceIds := []string{}
	for _, asset := range assets {
		if asset.ResourceType == "ECS Instance" {
			instanceIds = append(instanceIds, asset.ResourceId)
		}
	}

	if len(instanceIds) == 0 {
		return make(map[string]*EcsInstanceDetail), nil
	}

	// Convert to JSON array string
	instanceIdsJson, err := json.Marshal(instanceIds)
	if err != nil {
		return nil, err
	}

	// Call DescribeInstances API to get detailed information
	request := &ecs20140526.DescribeInstancesRequest{
		InstanceIds: tea.String(string(instanceIdsJson)),
		PageSize:    tea.Int32(100),
	}

	response, err := client.DescribeInstances(request)
	if err != nil {
		return nil, err
	}

	// Build map of instance details
	detailsMap := make(map[string]*EcsInstanceDetail)
	if response.Body.Instances != nil && response.Body.Instances.Instance != nil {
		for _, instance := range response.Body.Instances.Instance {
			instanceId := tea.StringValue(instance.InstanceId)

			// Extract public IP
			publicIp := ""
			if instance.EipAddress != nil && tea.StringValue(instance.EipAddress.IpAddress) != "" {
				publicIp = tea.StringValue(instance.EipAddress.IpAddress)
			} else if instance.PublicIpAddress != nil && len(instance.PublicIpAddress.IpAddress) > 0 {
				publicIp = tea.StringValue(instance.PublicIpAddress.IpAddress[0])
			}

			// Extract private IP
			privateIp := ""
			if instance.VpcAttributes != nil && instance.VpcAttributes.PrivateIpAddress != nil && len(instance.VpcAttributes.PrivateIpAddress.IpAddress) > 0 {
				privateIp = tea.StringValue(instance.VpcAttributes.PrivateIpAddress.IpAddress[0])
			}

			detailsMap[instanceId] = &EcsInstanceDetail{
				InstanceId:         instanceId,
				InstanceType:       tea.StringValue(instance.InstanceType),
				ImageId:            tea.StringValue(instance.ImageId),
				OSName:             tea.StringValue(instance.OSName),
				Cpu:                tea.Int32Value(instance.Cpu),
				Memory:             tea.Int32Value(instance.Memory),
				PublicIp:           publicIp,
				PrivateIp:          privateIp,
				InstanceChargeType: tea.StringValue(instance.InstanceChargeType),
				Status:             tea.StringValue(instance.Status),
			}
		}
	}

	return detailsMap, nil
}

// getDisks retrieves detailed information for disks
func (p *AlibabaCloudParser) getDisks(client *ecs20140526.Client, assets []*Asset) (map[string]*DiskDetail, error) {
	// Build a list of disk IDs
	diskIds := []string{}
	for _, asset := range assets {
		if asset.ResourceType == "Disk" {
			diskIds = append(diskIds, asset.ResourceId)
		}
	}

	if len(diskIds) == 0 {
		return make(map[string]*DiskDetail), nil
	}

	// Convert to JSON array string
	diskIdsJson, err := json.Marshal(diskIds)
	if err != nil {
		return nil, err
	}

	// Call DescribeDisks API to get detailed information
	request := &ecs20140526.DescribeDisksRequest{
		DiskIds:  tea.String(string(diskIdsJson)),
		PageSize: tea.Int32(100),
	}

	response, err := client.DescribeDisks(request)
	if err != nil {
		return nil, err
	}

	// Build map of disk details
	detailsMap := make(map[string]*DiskDetail)
	if response.Body.Disks != nil && response.Body.Disks.Disk != nil {
		for _, disk := range response.Body.Disks.Disk {
			diskId := tea.StringValue(disk.DiskId)
			detailsMap[diskId] = &DiskDetail{
				DiskId:             diskId,
				Size:               tea.Int32Value(disk.Size),
				Category:           tea.StringValue(disk.Category),
				Type:               tea.StringValue(disk.Type),
				Encrypted:          tea.BoolValue(disk.Encrypted),
				InstanceId:         tea.StringValue(disk.InstanceId),
				DiskChargeType:     tea.StringValue(disk.DiskChargeType),
				DeleteWithInstance: tea.BoolValue(disk.DeleteWithInstance),
				Status:             tea.StringValue(disk.Status),
			}
		}
	}

	return detailsMap, nil
}

// getVpcs retrieves detailed information for VPCs
func (p *AlibabaCloudParser) getVpcs(client *ecs20140526.Client, assets []*Asset) (map[string]*VpcDetail, error) {
	detailsMap := make(map[string]*VpcDetail)

	// VPC needs to be queried one by one
	for _, asset := range assets {
		if asset.ResourceType != "VPC" {
			continue
		}

		request := &ecs20140526.DescribeVpcsRequest{
			VpcId:    tea.String(asset.ResourceId),
			RegionId: tea.String(asset.Region),
			PageSize: tea.Int32(50),
		}

		response, err := client.DescribeVpcs(request)
		if err != nil {
			// Continue with other VPCs if one fails
			continue
		}

		if response.Body.Vpcs != nil && response.Body.Vpcs.Vpc != nil && len(response.Body.Vpcs.Vpc) > 0 {
			vpc := response.Body.Vpcs.Vpc[0]
			vpcId := tea.StringValue(vpc.VpcId)
			detailsMap[vpcId] = &VpcDetail{
				VpcId:       vpcId,
				CidrBlock:   tea.StringValue(vpc.CidrBlock),
				VRouterId:   tea.StringValue(vpc.VRouterId),
				IsDefault:   tea.BoolValue(vpc.IsDefault),
				Status:      tea.StringValue(vpc.Status),
				Description: tea.StringValue(vpc.Description),
			}
		}
	}

	return detailsMap, nil
}

// mergeEcsDetails merges ECS instance details into assets
func (p *AlibabaCloudParser) mergeEcsDetails(assets []*Asset, details map[string]*EcsInstanceDetail) {
	for _, asset := range assets {
		if asset.ResourceType != "ECS Instance" {
			continue
		}

		detail, ok := details[asset.ResourceId]
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
		properties["instanceType"] = detail.InstanceType
		properties["imageId"] = detail.ImageId
		properties["osName"] = detail.OSName
		properties["cpu"] = detail.Cpu
		properties["memory"] = detail.Memory
		properties["instanceChargeType"] = detail.InstanceChargeType
		if detail.PublicIp != "" {
			properties["publicIp"] = detail.PublicIp
		}
		if detail.PrivateIp != "" {
			properties["privateIp"] = detail.PrivateIp
		}

		// Update asset state
		asset.State = detail.Status

		// Marshal properties back to JSON
		propertiesJson, err := json.Marshal(properties)
		if err != nil {
			// If marshaling fails, keep the existing properties
			continue
		}
		asset.Properties = string(propertiesJson)
	}
}

// mergeDiskDetails merges disk details into assets
func (p *AlibabaCloudParser) mergeDiskDetails(assets []*Asset, details map[string]*DiskDetail) {
	for _, asset := range assets {
		if asset.ResourceType != "Disk" {
			continue
		}

		detail, ok := details[asset.ResourceId]
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
		properties["size"] = detail.Size
		properties["category"] = detail.Category
		properties["type"] = detail.Type
		properties["encrypted"] = detail.Encrypted
		properties["instanceId"] = detail.InstanceId
		properties["diskChargeType"] = detail.DiskChargeType
		properties["deleteWithInstance"] = detail.DeleteWithInstance

		// Update asset state
		asset.State = detail.Status

		// Marshal properties back to JSON
		propertiesJson, err := json.Marshal(properties)
		if err != nil {
			// If marshaling fails, keep the existing properties
			continue
		}
		asset.Properties = string(propertiesJson)
	}
}

// mergeVpcDetails merges VPC details into assets
func (p *AlibabaCloudParser) mergeVpcDetails(assets []*Asset, details map[string]*VpcDetail) {
	for _, asset := range assets {
		if asset.ResourceType != "VPC" {
			continue
		}

		detail, ok := details[asset.ResourceId]
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

		// Add detailed VPC information
		properties["cidrBlock"] = detail.CidrBlock
		properties["vRouterId"] = detail.VRouterId
		properties["isDefault"] = detail.IsDefault
		properties["status"] = detail.Status
		properties["description"] = detail.Description

		// Update asset state
		asset.State = detail.Status

		// Marshal properties back to JSON
		propertiesJson, err := json.Marshal(properties)
		if err != nil {
			// If marshaling fails, keep the existing properties
			continue
		}
		asset.Properties = string(propertiesJson)
	}
}
