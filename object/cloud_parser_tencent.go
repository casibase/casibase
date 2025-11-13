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

	"github.com/casibase/casibase/util"
	cbs "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cbs/v20170312"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	cvm "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cvm/v20170312"
	vpc "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/vpc/v20170312"
)

// TencentCloudParser implements CloudParser for Tencent Cloud
type TencentCloudParser struct{}

// ScanAssets scans all resources from Tencent Cloud
func (p *TencentCloudParser) ScanAssets(owner string, provider *Provider) ([]*Asset, error) {
	var assets []*Asset
	regions := ParseRegions(provider.Region)

	for _, region := range regions {
		cvmClient, err := p.createCvmClientWithRegion(provider, region)
		if err != nil {
			return nil, err
		}
		vpcClient, err := p.createVpcClientWithRegion(provider, region)
		if err != nil {
			return nil, err
		}
		cbsClient, err := p.createCbsClientWithRegion(provider, region)
		if err != nil {
			return nil, err
		}

		// CVM
		cvmAssets, err := p.scanCvmInstances(owner, provider, cvmClient, region)
		if err != nil {
			return nil, fmt.Errorf("failed to scan CVM instances (%s): %v", region, err)
		}
		assets = append(assets, cvmAssets...)

		// VPC
		vpcAssets, err := p.scanVpcs(owner, provider, vpcClient, region)
		if err != nil {
			return nil, fmt.Errorf("failed to scan VPCs (%s): %v", region, err)
		}
		assets = append(assets, vpcAssets...)

		// CBS
		if cbsClient != nil {
			diskAssets, err := p.scanDisks(owner, provider, cbsClient, region)
			if err == nil {
				assets = append(assets, diskAssets...)
			}
		}

		// Security Groups
		sgAssets, err := p.scanSecurityGroups(owner, provider, vpcClient, region)
		if err == nil {
			assets = append(assets, sgAssets...)
		}

		// Subnets
		subnetAssets, err := p.scanSubnets(owner, provider, vpcClient, region)
		if err == nil {
			assets = append(assets, subnetAssets...)
		}
	}

	return assets, nil
}

// createCvmClient creates a Tencent Cloud CVM client
func (p *TencentCloudParser) createCvmClient(provider *Provider) (*cvm.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "cvm.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"

	region := provider.Region
	if region == "" {
		region = "ap-guangzhou" // Default region
	}

	return cvm.NewClient(credential, region, cpf)
}

// createVpcClient creates a Tencent Cloud VPC client
func (p *TencentCloudParser) createVpcClient(provider *Provider) (*vpc.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "vpc.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"

	region := provider.Region
	if region == "" {
		region = "ap-guangzhou" // Default region
	}

	return vpc.NewClient(credential, region, cpf)
}

// createCbsClient creates a Tencent Cloud CBS client
func (p *TencentCloudParser) createCbsClient(provider *Provider) (*cbs.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "cbs.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"

	region := provider.Region
	if region == "" {
		region = "ap-guangzhou" // Default region
	}

	return cbs.NewClient(credential, region, cpf)
}

// scanCvmInstances scans CVM instances
func (p *TencentCloudParser) scanCvmInstances(owner string, provider *Provider, client *cvm.Client, region string) ([]*Asset, error) {
	var assets []*Asset
	offset := int64(0)
	limit := int64(100)

	for {
		request := cvm.NewDescribeInstancesRequest()
		request.Limit = common.Int64Ptr(limit)
		request.Offset = common.Int64Ptr(offset)

		response, err := client.DescribeInstances(request)
		if err != nil {
			return nil, err
		}

		if response.Response.InstanceSet != nil {
			for _, instance := range response.Response.InstanceSet {
				asset := p.convertCvmInstanceToAsset(owner, provider, instance)
				// 确保 Region 一致：优先使用循环的 region，其次尝试从 zone 推断
				zone := ""
				if instance.Placement != nil && instance.Placement.Zone != nil {
					zone = *instance.Placement.Zone
				}
				inferred := InferRegionFromZone(zone)
				if inferred != "" {
					asset.Region = inferred
				} else {
					asset.Region = region
				}
				assets = append(assets, asset)
			}
		}

		totalCount := int64(0)
		if response.Response.TotalCount != nil {
			totalCount = *response.Response.TotalCount
		}
		if offset+limit >= totalCount {
			break
		}
		offset += limit
	}

	return assets, nil
}

// scanVpcs scans VPC resources
func (p *TencentCloudParser) scanVpcs(owner string, provider *Provider, client *vpc.Client, region string) ([]*Asset, error) {
	var assets []*Asset
	offset := int64(0)
	limit := int64(100)

	for {
		request := vpc.NewDescribeVpcsRequest()
		request.Limit = common.StringPtr(fmt.Sprintf("%d", limit))
		request.Offset = common.StringPtr(fmt.Sprintf("%d", offset))

		response, err := client.DescribeVpcs(request)
		if err != nil {
			return nil, err
		}

		if response.Response.VpcSet != nil {
			for _, vpcItem := range response.Response.VpcSet {
				asset := p.convertVpcToAsset(owner, provider, vpcItem)
				asset.Region = region
				assets = append(assets, asset)
			}
		}

		total := int64(0)
		if response.Response.TotalCount != nil {
			total = int64(*response.Response.TotalCount)
		}
		if offset+limit >= total {
			break
		}
		offset += limit
	}

	return assets, nil
}

// scanDisks scans CBS disks
func (p *TencentCloudParser) scanDisks(owner string, provider *Provider, client *cbs.Client, region string) ([]*Asset, error) {
	var assets []*Asset
	offset := uint64(0)
	limit := uint64(100)

	for {
		req := cbs.NewDescribeDisksRequest()
		req.Offset = common.Uint64Ptr(offset)
		req.Limit = common.Uint64Ptr(limit)

		resp, err := client.DescribeDisks(req)
		if err != nil {
			return nil, fmt.Errorf("DescribeDisks failed: %v", err)
		}

		if resp.Response.DiskSet != nil {
			for _, d := range resp.Response.DiskSet {
				a := p.convertDiskToAsset(owner, provider, d)
				a.Region = region
				assets = append(assets, a)
			}
		}

		total := uint64(0)
		if resp.Response.TotalCount != nil {
			total = uint64(*resp.Response.TotalCount)
		}
		if offset+limit >= total {
			break
		}
		offset += limit
	}

	return assets, nil
}

// scanSecurityGroups scans VPC Security Groups
func (p *TencentCloudParser) scanSecurityGroups(owner string, provider *Provider, client *vpc.Client, region string) ([]*Asset, error) {
	var assets []*Asset
	offset := int64(0)
	limit := int64(100)

	for {
		req := vpc.NewDescribeSecurityGroupsRequest()
		req.Limit = common.StringPtr(fmt.Sprintf("%d", limit))
		req.Offset = common.StringPtr(fmt.Sprintf("%d", offset))

		resp, err := client.DescribeSecurityGroups(req)
		if err != nil {
			return nil, err
		}

		if resp.Response.SecurityGroupSet != nil {
			for _, sg := range resp.Response.SecurityGroupSet {
				properties := map[string]interface{}{}
				if sg.CreatedTime != nil {
					properties["createTime"] = *sg.CreatedTime
				}

				propsJSON, err := json.Marshal(properties)
				if err != nil {
					propsJSON = []byte("{}")
				}

				tag := p.formatTagsFromVpc(sg.TagSet)

				assets = append(assets, &Asset{
					Owner:       owner,
					Name:        util.GenerateId(),
					CreatedTime: util.GetCurrentTime(),
					UpdatedTime: util.GetCurrentTime(),
					DisplayName: p.getStringValue(sg.SecurityGroupName),
					Provider:    provider.Name,
					Id:          p.getStringValue(sg.SecurityGroupId),
					Type:        "Security Group",
					Region:      region,
					Zone:        "",
					State:       "",
					Tag:         tag,
					Properties:  string(propsJSON),
				})
			}
		}

		total := int64(0)
		if resp.Response.TotalCount != nil {
			total = int64(*resp.Response.TotalCount)
		}
		if offset+limit >= total {
			break
		}
		offset += limit
	}

	return assets, nil
}

// scanSubnets scans VPC Subnets
func (p *TencentCloudParser) scanSubnets(owner string, provider *Provider, client *vpc.Client, region string) ([]*Asset, error) {
	var assets []*Asset
	offset := int64(0)
	limit := int64(100)

	for {
		req := vpc.NewDescribeSubnetsRequest()
		req.Limit = common.StringPtr(fmt.Sprintf("%d", limit))
		req.Offset = common.StringPtr(fmt.Sprintf("%d", offset))

		resp, err := client.DescribeSubnets(req)
		if err != nil {
			return nil, err
		}

		if resp.Response.SubnetSet != nil {
			for _, s := range resp.Response.SubnetSet {
				properties := map[string]interface{}{}
				if s.CidrBlock != nil {
					properties["cidrBlock"] = *s.CidrBlock
				}
				if s.IsDefault != nil {
					properties["isDefault"] = *s.IsDefault
				}
				if s.CreatedTime != nil {
					properties["createTime"] = *s.CreatedTime
				}

				propsJSON, err := json.Marshal(properties)
				if err != nil {
					propsJSON = []byte("{}")
				}

				tag := p.formatTagsFromVpc(s.TagSet)

				assets = append(assets, &Asset{
					Owner:       owner,
					Name:        util.GenerateId(),
					CreatedTime: util.GetCurrentTime(),
					UpdatedTime: util.GetCurrentTime(),
					DisplayName: p.getStringValue(s.SubnetName),
					Provider:    provider.Name,
					Id:          p.getStringValue(s.SubnetId),
					Type:        "Subnet",
					Region:      region,
					Zone:        p.getStringValue(s.Zone),
					State:       "",
					Tag:         tag,
					Properties:  string(propsJSON),
				})
			}
		}

		total := int64(0)
		if resp.Response.TotalCount != nil {
			total = int64(*resp.Response.TotalCount)
		}
		if offset+limit >= total {
			break
		}
		offset += limit
	}

	return assets, nil
}

// convertCvmInstanceToAsset converts a Tencent Cloud CVM instance to an Asset
func (p *TencentCloudParser) convertCvmInstanceToAsset(owner string, provider *Provider, instance *cvm.Instance) *Asset {
	// Extract public and private IPs
	publicIp := ""
	if instance.PublicIpAddresses != nil && len(instance.PublicIpAddresses) > 0 {
		publicIp = *instance.PublicIpAddresses[0]
	}

	privateIp := ""
	if instance.PrivateIpAddresses != nil && len(instance.PrivateIpAddresses) > 0 {
		privateIp = *instance.PrivateIpAddresses[0]
	}

	// Build properties map
	properties := map[string]interface{}{
		"instanceType": p.getStringValue(instance.InstanceType),
		"imageId":      p.getStringValue(instance.ImageId),
		"osName":       p.getStringValue(instance.OsName),
	}

	if instance.CPU != nil {
		properties["cpu"] = *instance.CPU
	}
	if instance.Memory != nil {
		properties["memory"] = *instance.Memory
	}
	if publicIp != "" {
		properties["publicIp"] = publicIp
	}
	if privateIp != "" {
		properties["privateIp"] = privateIp
	}
	if instance.InstanceChargeType != nil {
		properties["instanceChargeType"] = *instance.InstanceChargeType
	}
	if instance.CreatedTime != nil {
		properties["createTime"] = *instance.CreatedTime
	}
	if instance.ExpiredTime != nil {
		properties["expireTime"] = *instance.ExpiredTime
	}

	propertiesJson, err := json.Marshal(properties)
	if err != nil {
		propertiesJson = []byte("{}")
	}

	// Extract tags
	tag := p.formatTagsFromCvm(instance.Tags)

	// Extract zone and region
	zone := ""
	if instance.Placement != nil && instance.Placement.Zone != nil {
		zone = *instance.Placement.Zone
	}

	state := ""
	if instance.InstanceState != nil {
		state = *instance.InstanceState
	}

	asset := &Asset{
		Owner:       owner,
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		DisplayName: p.getStringValue(instance.InstanceName),
		Provider:    provider.Name,
		Id:          p.getStringValue(instance.InstanceId),
		Type:        "Virtual Machine",
		Region:      provider.Region,
		Zone:        zone,
		State:       state,
		Tag:         tag,
		Properties:  string(propertiesJson),
	}

	return asset
}

// convertVpcToAsset converts a Tencent Cloud VPC to an Asset
func (p *TencentCloudParser) convertVpcToAsset(owner string, provider *Provider, vpcItem *vpc.Vpc) *Asset {
	// Build properties map
	properties := map[string]interface{}{}

	if vpcItem.CidrBlock != nil {
		properties["cidrBlock"] = *vpcItem.CidrBlock
	}
	if vpcItem.IsDefault != nil {
		properties["isDefault"] = *vpcItem.IsDefault
	}
	if vpcItem.CreatedTime != nil {
		properties["createTime"] = *vpcItem.CreatedTime
	}

	propertiesJson, err := json.Marshal(properties)
	if err != nil {
		propertiesJson = []byte("{}")
	}

	// Extract tags
	tag := p.formatTagsFromVpc(vpcItem.TagSet)

	asset := &Asset{
		Owner:       owner,
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		DisplayName: p.getStringValue(vpcItem.VpcName),
		Provider:    provider.Name,
		Id:          p.getStringValue(vpcItem.VpcId),
		Type:        "VPC",
		Region:      provider.Region,
		Zone:        "",
		State:       "",
		Tag:         tag,
		Properties:  string(propertiesJson),
	}

	return asset
}

// getStringValue safely extracts string value from pointer
func (p *TencentCloudParser) getStringValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}

// convertDiskToAsset converts a Tencent Cloud CBS disk to an Asset
func (p *TencentCloudParser) convertDiskToAsset(owner string, provider *Provider, disk *cbs.Disk) *Asset {
	properties := map[string]interface{}{}
	if disk.DiskType != nil {
		properties["type"] = *disk.DiskType
	}
	if disk.DiskSize != nil {
		properties["size"] = *disk.DiskSize
	}
	if disk.DiskChargeType != nil {
		properties["diskChargeType"] = *disk.DiskChargeType
	}
	if disk.Encrypt != nil {
		properties["encrypted"] = *disk.Encrypt
	}
	if disk.InstanceId != nil {
		properties["instanceId"] = *disk.InstanceId
	}
	if disk.CreateTime != nil {
		properties["createTime"] = *disk.CreateTime
	}
	// The CBS disk expiration field is DeadlineTime (valid for prepaid), not ExpiredTime
	if disk.DeadlineTime != nil {
		properties["expireTime"] = *disk.DeadlineTime
	}

	propsJSON, err := json.Marshal(properties)
	if err != nil {
		propsJSON = []byte("{}")
	}

	state := ""
	if disk.DiskState != nil {
		state = *disk.DiskState
	}

	tag := p.formatTagsFromCbs(disk.Tags)

	return &Asset{
		Owner:       owner,
		Name:        util.GenerateId(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		DisplayName: p.getStringValue(disk.DiskName),
		Provider:    provider.Name,
		Id:          p.getStringValue(disk.DiskId),
		Type:        "Disk",
		Region:      provider.Region,
		Zone:        p.getStringValue(disk.Placement.Zone),
		State:       state,
		Tag:         tag,
		Properties:  string(propsJSON),
	}
}

// formatTagsFromVpc formats tags from VPC resources
// formatTagsFromVpc formats tags from VPC resources
func (p *TencentCloudParser) formatTagsFromVpc(tags []*vpc.Tag) string {
	if tags == nil {
		return ""
	}
	s := ""
	for _, t := range tags {
		if t.Key != nil && t.Value != nil {
			s += fmt.Sprintf("%s=%s,", *t.Key, *t.Value)
		}
	}
	return s
}

// formatTagsFromCbs formats tags from CBS resources
func (p *TencentCloudParser) formatTagsFromCbs(tags []*cbs.Tag) string {
	if tags == nil {
		return ""
	}
	s := ""
	for _, t := range tags {
		if t.Key != nil && t.Value != nil {
			s += fmt.Sprintf("%s=%s,", *t.Key, *t.Value)
		}
	}
	return s
}

// formatTagsFromCvm formats tags from CVM resources
func (p *TencentCloudParser) formatTagsFromCvm(tags []*cvm.Tag) string {
	if tags == nil {
		return ""
	}
	s := ""
	for _, t := range tags {
		if t.Key != nil && t.Value != nil {
			s += fmt.Sprintf("%s=%s,", *t.Key, *t.Value)
		}
	}
	return s
}

// createCvmClientWithRegion creates a CVM client for a specific region
func (p *TencentCloudParser) createCvmClientWithRegion(provider *Provider, region string) (*cvm.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "cvm.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"
	if region == "" {
		region = "ap-guangzhou"
	}
	return cvm.NewClient(credential, region, cpf)
}

// createVpcClientWithRegion creates a VPC client for a specific region
func (p *TencentCloudParser) createVpcClientWithRegion(provider *Provider, region string) (*vpc.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "vpc.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"
	if region == "" {
		region = "ap-guangzhou"
	}
	return vpc.NewClient(credential, region, cpf)
}

// createCbsClientWithRegion creates a CBS client for a specific region
func (p *TencentCloudParser) createCbsClientWithRegion(provider *Provider, region string) (*cbs.Client, error) {
	credential := common.NewCredential(provider.ClientId, provider.ClientSecret)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.ReqMethod = "POST"
	cpf.HttpProfile.ReqTimeout = 60
	cpf.HttpProfile.Endpoint = "cbs.tencentcloudapi.com"
	cpf.SignMethod = "TC3-HMAC-SHA256"
	if region == "" {
		region = "ap-guangzhou"
	}
	return cbs.NewClient(credential, region, cpf)
}
