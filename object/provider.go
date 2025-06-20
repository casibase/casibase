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

package object

import (
	"fmt"
	"strings"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/agent"
	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/stt"
	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Provider struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`

	DisplayName        string            `xorm:"varchar(100)" json:"displayName"`
	Category           string            `xorm:"varchar(100)" json:"category"`
	Type               string            `xorm:"varchar(100)" json:"type"`
	SubType            string            `xorm:"varchar(100)" json:"subType"`
	Flavor             string            `xorm:"varchar(100)" json:"flavor"`
	ClientId           string            `xorm:"varchar(100)" json:"clientId"`
	ClientSecret       string            `xorm:"varchar(2000)" json:"clientSecret"`
	Region             string            `xorm:"varchar(100)" json:"region"`
	ProviderKey        string            `xorm:"varchar(100)" json:"providerKey"`
	ProviderUrl        string            `xorm:"varchar(200)" json:"providerUrl"`
	ApiVersion         string            `xorm:"varchar(100)" json:"apiVersion"`
	CompitableProvider string            `xorm:"varchar(100)" json:"compitableProvider"`
	McpTools           []*agent.McpTools `xorm:"text" json:"mcpTools"`
	Text               string            `xorm:"mediumtext" json:"text"`

	Temperature      float32 `xorm:"float" json:"temperature"`
	TopP             float32 `xorm:"float" json:"topP"`
	TopK             int     `xorm:"int" json:"topK"`
	FrequencyPenalty float32 `xorm:"float" json:"frequencyPenalty"`
	PresencePenalty  float32 `xorm:"float" json:"presencePenalty"`

	InputPricePerThousandTokens  float64 `xorm:"DECIMAL(10, 4)" json:"inputPricePerThousandTokens"`
	OutputPricePerThousandTokens float64 `xorm:"DECIMAL(10, 4)" json:"outputPricePerThousandTokens"`
	Currency                     string  `xorm:"varchar(100)" json:"currency"`

	UserKey        string `xorm:"varchar(1000)" json:"userKey"`
	UserCert       string `xorm:"mediumtext" json:"userCert"`
	SignKey        string `xorm:"varchar(1000)" json:"signKey"`
	SignCert       string `xorm:"mediumtext" json:"signCert"`
	ContractName   string `xorm:"varchar(100)" json:"contractName"`
	ContractMethod string `xorm:"varchar(100)" json:"contractMethod"`
	Network        string `xorm:"varchar(100)" json:"network"`
	Chain          string `xorm:"varchar(100)" json:"chain"`
	TestContent    string `xorm:"varchar(100)" json:"testContent"`

	IsDefault  bool   `json:"isDefault"`
	State      string `xorm:"varchar(100)" json:"state"`
	BrowserUrl string `xorm:"varchar(200)" json:"browserUrl"`
}

func GetMaskedProvider(provider *Provider, isMaskEnabled bool, user *casdoorsdk.User) *Provider {
	if !isMaskEnabled {
		return provider
	}

	if provider == nil {
		return nil
	}

	if provider.ClientSecret != "" {
		provider.ClientSecret = "***"
	}

	if !isAdmin(user) {
		if provider.ProviderKey != "" {
			provider.ProviderKey = "***"
		}
		if provider.UserKey != "" {
			provider.UserKey = "***"
		}
		if provider.SignKey != "" {
			provider.SignKey = "***"
		}
	}

	return provider
}

func GetMaskedProviders(providers []*Provider, isMaskEnabled bool, user *casdoorsdk.User) []*Provider {
	if !isMaskEnabled {
		return providers
	}

	for _, provider := range providers {
		provider = GetMaskedProvider(provider, isMaskEnabled, user)
	}
	return providers
}

func GetGlobalProviders() ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Asc("owner").Desc("created_time").Find(&providers)
	if err != nil {
		return providers, err
	}

	if providerAdapter != nil {
		providers = getFilteredProviders(providers, true)

		providers2 := []*Provider{}
		err = providerAdapter.engine.Asc("owner").Desc("created_time").Find(&providers2)
		if err != nil {
			return providers2, err
		}

		providers = append(providers, providers2...)
	}

	return providers, nil
}

func GetProviders(owner string) ([]*Provider, error) {
	providers := []*Provider{}
	err := adapter.engine.Desc("created_time").Find(&providers, &Provider{Owner: owner})
	if err != nil {
		return providers, err
	}

	if providerAdapter != nil {
		providers2 := []*Provider{}
		err = providerAdapter.engine.Desc("created_time").Find(&providers2, &Provider{Owner: owner})
		if err != nil {
			return providers2, err
		}

		providers = getFilteredProviders(providers, true)
		providers2 = getFilteredProviders(providers2, false)
		providers = append(providers, providers2...)
	}

	return providers, nil
}

func getProvider(owner string, name string) (*Provider, error) {
	provider := Provider{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.Get(&provider)
		if err != nil {
			return &provider, err
		}
		if provider.Category == "Storage" {
			return nil, nil
		}
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
	if provider.UserKey == "***" {
		provider.UserKey = p.UserKey
	}
	if provider.SignKey == "***" {
		provider.SignKey = p.SignKey
	}

	if provider.ProviderKey == "" && provider.Category == "Model" {
		provider.ProviderKey = generateProviderKey()
	}

	if provider.Type == "Ollama" && provider.ProviderUrl != "" && !strings.HasPrefix(provider.ProviderUrl, "http") {
		provider.ProviderUrl = "http://" + provider.ProviderUrl
	}

	if providerAdapter != nil && provider.Category != "Storage" {
		_, err = providerAdapter.engine.ID(core.PK{owner, name}).AllCols().Update(provider)
		if err != nil {
			return false, err
		}

		// return affected != 0
		return true, nil
	}

	_, err = adapter.engine.ID(core.PK{owner, name}).AllCols().Update(provider)
	if err != nil {
		return false, err
	}

	// return affected != 0
	return true, nil
}

func AddProvider(provider *Provider) (bool, error) {
	if provider.ProviderKey == "" && provider.Category == "Model" {
		provider.ProviderKey = generateProviderKey()
	}

	if providerAdapter != nil && provider.Category != "Storage" {
		affected, err := providerAdapter.engine.Insert(provider)
		if err != nil {
			return false, err
		}

		return affected != 0, nil
	}

	affected, err := adapter.engine.Insert(provider)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteProvider(provider *Provider) (bool, error) {
	if providerAdapter != nil && provider.Category != "Storage" {
		affected, err := providerAdapter.engine.ID(core.PK{provider.Owner, provider.Name}).Delete(&Provider{})
		if err != nil {
			return false, err
		}

		return affected != 0, nil
	}

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
	pProvider, err := model.GetModelProvider(p.Type, p.SubType, p.ClientId, p.ClientSecret, p.Temperature, p.TopP, p.TopK, p.FrequencyPenalty, p.PresencePenalty, p.ProviderUrl, p.ApiVersion, p.CompitableProvider, p.InputPricePerThousandTokens, p.OutputPricePerThousandTokens, p.Currency)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the model provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetEmbeddingProvider() (embedding.EmbeddingProvider, error) {
	pProvider, err := embedding.GetEmbeddingProvider(p.Type, p.SubType, p.ClientId, p.ClientSecret, p.ProviderUrl, p.ApiVersion, p.InputPricePerThousandTokens, p.Currency)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the embedding provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetAgentProvider() (agent.AgentProvider, error) {
	pProvider, err := agent.GetAgentProvider(p.Type, p.SubType, p.Text, p.McpTools)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the agent provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetTextToSpeechProvider() (tts.TextToSpeechProvider, error) {
	pProvider, err := tts.GetTextToSpeechProvider(p.Type, p.SubType, p.ClientId, p.ClientSecret, p.ProviderUrl, p.ApiVersion, p.InputPricePerThousandTokens, p.Currency, p.Flavor)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the TTS provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func (p *Provider) GetSpeechToTextProvider() (stt.SpeechToTextProvider, error) {
	pProvider, err := stt.GetSpeechToTextProvider(p.Type, p.SubType, p.ClientSecret, p.ProviderUrl)
	if err != nil {
		return nil, err
	}

	if pProvider == nil {
		return nil, fmt.Errorf("the STT provider type: %s is not supported", p.Type)
	}

	return pProvider, nil
}

func GetModelProviderFromContext(owner string, name string) (*Provider, model.ModelProvider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := GetDefaultStore(owner)
		if err != nil {
			return nil, nil, err
		}

		if store != nil && store.ModelProvider != "" {
			providerName = store.ModelProvider
		}
	}

	return getModelProviderFromName(owner, providerName)
}

func GetEmbeddingProviderFromContext(owner string, name string) (*Provider, embedding.EmbeddingProvider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := GetDefaultStore(owner)
		if err != nil {
			return nil, nil, err
		}

		if store != nil && store.EmbeddingProvider != "" {
			providerName = store.EmbeddingProvider
		}
	}

	return getEmbeddingProviderFromName(owner, providerName)
}

func GetAgentProviderFromContext(owner string, name string) (*Provider, agent.AgentProvider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := GetDefaultStore(owner)
		if err != nil {
			return nil, nil, err
		}

		if store != nil && store.AgentProvider != "" {
			providerName = store.AgentProvider
		}
	}

	return getAgentProviderFromName(owner, providerName)
}

func GetAgentClients(agentProviderObj agent.AgentProvider) (*agent.AgentClients, error) {
	if agentProviderObj == nil {
		return nil, nil
	}
	return agentProviderObj.GetAgentClients()
}

func GetProviderCount(owner, field, value string) (int64, error) {
	session := GetSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Provider{})
}

func GetPaginationProviders(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Provider, error) {
	providers := []*Provider{}
	session := GetSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&providers)
	if err != nil {
		return providers, err
	}

	return providers, nil
}

func RefreshMcpTools(provider *Provider) error {
	tools, err := agent.GetToolsList(provider.Text)
	if err != nil {
		return err
	}

	provider.McpTools = tools
	return nil
}
