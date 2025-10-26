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
	"strings"
	"time"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	resourcecenter20221201 "github.com/alibabacloud-go/resourcecenter-20221201/client"
	teautil "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/aliyun/credentials-go/credentials"
	"github.com/casibase/casibase/util"
)

func ScanAssetsFromProvider(owner string, providerName string) (bool, error) {
	provider, err := getProvider("admin", providerName)
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
		assets, err = ScanAliyunAssets(owner, provider)
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

func CreateClient(credit_id string, credit_secret string) (result *resourcecenter20221201.Client, err error) {
	credentialsConfig := new(credentials.Config).
		SetType("access_key").
		SetAccessKeyId(credit_id).
		SetAccessKeySecret(credit_secret)

	if err != nil {
		return result, err
	}

	akCredential, err := credentials.NewCredential(credentialsConfig)
	if err != nil {
		return
	}
	config := &openapi.Config{
		Credential: akCredential,
	}

	// Endpoint refer https://api.aliyun.com/product/ResourceCenter
	config.Endpoint = tea.String("resourcecenter.aliyuncs.com")
	result = &resourcecenter20221201.Client{}
	result, err = resourcecenter20221201.NewClient(config)
	return result, err
}

func ScanAliyunAssets(owner string, provider *Provider) ([]*Asset, error) {
	client, err := CreateClient(provider.ClientId, provider.ClientSecret)
	if err != nil {
		return nil, err
	}
	var assets []*Asset
	searchResourcesRequest := &resourcecenter20221201.SearchResourcesRequest{}
	runtime := &teautil.RuntimeOptions{}
	_, err = client.EnableResourceCenterWithOptions(runtime)
	if err != nil {
		return assets, err
	}
	resp, err := client.SearchResourcesWithOptions(searchResourcesRequest, runtime)
	if err != nil {
		return nil, err
	}
	for _, resource := range resp.Body.Resources {
		state, _ := CheckResourceState(resource.CreateTime, resource.ExpireTime)
		var tagParts []string
		for _, t := range resource.Tags {
			k := tea.StringValue(t.Key)
			v := tea.StringValue(t.Value)
			tagParts = append(tagParts, fmt.Sprintf("%s=%s", k, v))
		}
		tagStr := strings.Join(tagParts, ";")
		propertiesJsonStr, err := GetResourcePropertiesJsonStr(client, *resource.RegionId, *resource.ResourceType, *resource.ResourceId)
		if err != nil {
			return assets, err
		}
		asset := &Asset{
			Owner:        owner,
			Name:         util.GenerateId(),
			CreatedTime:  tea.StringValue(resource.CreateTime),
			UpdatedTime:  util.GetCurrentTime(),
			DisplayName:  tea.StringValue(resource.ResourceName),
			Provider:     provider.Name,
			ResourceId:   tea.StringValue(resource.ResourceId),
			ResourceType: tea.StringValue(resource.ResourceType),
			Region:       tea.StringValue(resource.RegionId),
			Zone:         tea.StringValue(resource.ZoneId),
			State:        state,
			Tag:          tagStr,
			Properties:   propertiesJsonStr,
		}
		assets = append(assets, asset)
	}
	return assets, nil
}

func CheckResourceState(createTime *string, expireTime *string) (state string, err error) {
	if expireTime == nil {
		return "Available", nil
	}
	t, err := time.Parse(time.RFC3339, *expireTime)
	if err != nil {
		return "", err
	}
	now := time.Now().UTC()
	isAvailable := now.Before(t)
	if isAvailable {
		return "Available", nil
	} else {
		return "Not Available", nil
	}
}

func GetResourceProperties(client *resourcecenter20221201.Client, resourceRegionId string, resourceType string, resourceId string) (properties interface{}, err error) {
	getResourceConfigurationRequest := &resourcecenter20221201.GetResourceConfigurationRequest{ResourceId: &resourceId, ResourceRegionId: &resourceRegionId, ResourceType: &resourceType}
	runtime := &teautil.RuntimeOptions{}
	resp, err := client.GetResourceConfigurationWithOptions(getResourceConfigurationRequest, runtime)
	if err != nil {
		return nil, err
	}
	properties = resp.Body.Configuration
	return properties, nil
}

func GetResourcePropertiesJsonStr(client *resourcecenter20221201.Client, resourceRegionId string, resourceType string, resourceId string) (jsonStr string, err error) {
	properties, err := GetResourceProperties(client, resourceRegionId, resourceType, resourceId)
	if err != nil {
		return "", err
	}

	data, err := json.Marshal(properties)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
