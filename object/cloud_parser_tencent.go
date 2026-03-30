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
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	cvm "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cvm/v20170312"
	vpc "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/vpc/v20170312"
)

// TencentCloudParser implements CloudParser for Tencent Cloud
type TencentCloudParser struct{}

// ScanAssets scans all resources from Tencent Cloud
func (p *TencentCloudParser) ScanAssets(owner string, provider *Provider) ([]*Asset, error) {
	cvmClient, err := p.createCvmClient(provider)
	if err != nil {
		return nil, err
	}

	vpcClient, err := p.createVpcClient(provider)
	if err != nil {
		return nil, err
	}

	var assets []*Asset

	// Scan CVM instances
	cvmAssets, err := p.scanCvmInstances(owner, provider, cvmClient)
	if err != nil {
		return nil, fmt.Errorf("failed to scan CVM instances: %v", err)
	}
	assets = append(assets, cvmAssets...)

	// Scan VPC resources
	vpcAssets, err := p.scanVpcs(owner, provider, vpcClient)
	if err != nil {
		return nil, fmt.Errorf("failed to scan VPCs: %v", err)
	}
	assets = append(assets, vpcAssets...)

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

// scanCvmInstances scans CVM instances
func (p *TencentCloudParser) scanCvmInstances(owner string, provider *Provider, client *cvm.Client) ([]*Asset, error) {
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
				assets = append(assets, asset)
			}
		}

		// Check if there are more pages
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
func (p *TencentCloudParser) scanVpcs(owner string, provider *Provider, client *vpc.Client) ([]*Asset, error) {
	var assets []*Asset

	request := vpc.NewDescribeVpcsRequest()
	request.Limit = common.StringPtr("100")

	response, err := client.DescribeVpcs(request)
	if err != nil {
		return nil, err
	}

	if response.Response.VpcSet != nil {
		for _, vpcItem := range response.Response.VpcSet {
			asset := p.convertVpcToAsset(owner, provider, vpcItem)
			assets = append(assets, asset)
		}
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
	tag := ""
	if instance.Tags != nil {
		for _, t := range instance.Tags {
			if t.Key != nil && t.Value != nil {
				tag += fmt.Sprintf("%s=%s,", *t.Key, *t.Value)
			}
		}
	}

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
	tag := ""
	if vpcItem.TagSet != nil {
		for _, t := range vpcItem.TagSet {
			if t.Key != nil && t.Value != nil {
				tag += fmt.Sprintf("%s=%s,", *t.Key, *t.Value)
			}
		}
	}

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
