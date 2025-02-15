// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package storage

import (
	"bytes"
	"fmt"

	"github.com/beego/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

type CasdoorProvider struct {
	providerName string
}

func NewCasdoorProvider(providerName string) (*CasdoorProvider, error) {
	if providerName == "" {
		return nil, fmt.Errorf("storage provider name: [%s] doesn't exist", providerName)
	}

	return &CasdoorProvider{providerName: providerName}, nil
}

func (p *CasdoorProvider) ListObjects(prefix string) ([]*Object, error) {
	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	casdoorApplication := beego.AppConfig.String("casdoorApplication")
	resources, err := casdoorsdk.GetResources(casdoorOrganization, casdoorApplication, "provider", p.providerName, "Direct", prefix)
	if err != nil {
		return nil, err
	}

	res := []*Object{}
	for _, resource := range resources {
		res = append(res, &Object{
			Key:          resource.Name,
			LastModified: resource.CreatedTime,
			Size:         int64(resource.FileSize),
			Url:          resource.Url,
		})
	}
	return res, nil
}

func (p *CasdoorProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	fileUrl, _, err := casdoorsdk.UploadResource(user, "Casibase", parent, fmt.Sprintf("Direct/%s/%s", p.providerName, key), fileBuffer.Bytes())
	if err != nil {
		return "", err
	}
	return fileUrl, nil
}

func (p *CasdoorProvider) DeleteObject(key string) error {
	resource := casdoorsdk.Resource{
		Name: key,
	}

	_, err := casdoorsdk.DeleteResource(&resource)
	if err != nil {
		return err
	}
	return nil
}
