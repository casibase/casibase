// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"fmt"

	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Provider struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName  string `xorm:"varchar(100)" json:"displayName"`
	Category     string `xorm:"varchar(100)" json:"category"`
	Type         string `xorm:"varchar(100)" json:"type"`
	SubType      string `xorm:"varchar(100)" json:"subType"`
	ClientId     string `xorm:"varchar(100)" json:"clientId"`
	ClientSecret string `xorm:"varchar(2000)" json:"clientSecret"`
	ProviderUrl  string `xorm:"varchar(200)" json:"providerUrl"`
	ApiVersion   string `xorm:"varchar(100)" json:"apiVersion"`

	Temperature      float32 `xorm:"float" json:"temperature"`
	TopP             float32 `xorm:"float" json:"topP"`
	TopK             int     `xorm:"int" json:"topK"`
	FrequencyPenalty float32 `xorm:"float" json:"frequencyPenalty"`
	PresencePenalty  float32 `xorm:"float" json:"presencePenalty"`
}

func GetMaskedProvider(provider *Provider, isMaskEnabled bool) *Provider {
	if !isMaskEnabled {
		return provider
	}

	if provider == nil {
		return nil
	}

	if provider.ClientSecret != "" {
		provider.ClientSecret = "***"
	}

	return provider
}

func GetMaskedProviders(providers []*Provider, isMaskEnabled bool) []*Provider {
	if !isMaskEnabled {
		return providers
	}

	for _, provider := range providers {
		provider = GetMaskedProvider(provider, isMaskEnabled)
	}
	return providers
}

func GetGlobalProviders() ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&providers)
	if err != nil {
		return providers, err
	}

	return providers, nil
}

func GetProviders(owner string) ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Desc("created_time").Find(&providers, &Provider{Owner: owner})
	if err != nil {
		return providers, err
	}

	return providers, nil
}

func getProvider(owner string, name string) (*Provider, error) {
	provider := Provider{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if existed {
		return &provider, nil
	} else {
		return nil, nil
	}
}

func GetProvider(id string) (*Provider, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getProvider(owner, name)
}

func GetDefaultStorageProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Storage"}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultModelProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Model"}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultEmbeddingProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Embedding"}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func UpdateProvider(id string, provider *Provider) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	p, err := getProvider(owner, name)
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, nil
	}

	if provider.ClientSecret == "***" {
		provider.ClientSecret = p.ClientSecret
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(provider)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddProvider(provider *Provider) (bool, error) {
	affected, err := adapter.engine.Insert(provider)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteProvider(provider *Provider) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{provider.Owner, provider.Name}).Delete(&Provider{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (provider *Provider) GetId() string {
	return fmt.Sprintf("%s/%s", provider.Owner, provider.Name)
}

func (p *Provider) GetStorageProviderObj() (storage.StorageProvider, error) {
	pProvider, err := storage.GetStorageProvider(p.Type, p.ClientId, p.Name)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the storage provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetModelProvider() (model.ModelProvider, error) {
	pProvider, err := model.GetModelProvider(p.Type, p.SubType, p.ClientId, p.ClientSecret, p.Temperature, p.TopP, p.TopK, p.FrequencyPenalty, p.PresencePenalty, p.ProviderUrl, p.ApiVersion)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the model provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetEmbeddingProvider() (embedding.EmbeddingProvider, error) {
	pProvider, err := embedding.GetEmbeddingProvider(p.Type, p.SubType, p.ClientId, p.ClientSecret, p.ProviderUrl, p.ApiVersion)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the embedding provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}
