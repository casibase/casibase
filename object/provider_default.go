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
	"fmt"

	"github.com/casibase/casibase/model"
)

// GetProviderByApiKey retrieves a provider using the API key
func GetProviderByApiKey(apiKey string) (*Provider, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("empty API key")
	}

	provider := &Provider{}

	// Try to find in main database first
	existed, err := adapter.engine.Where("api_key = ?", apiKey).Get(provider)
	if err != nil {
		return nil, err
	}

	// If not found in main database, try provider adapter
	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.Where("api_key = ?", apiKey).Get(provider)
		if err != nil {
			return nil, err
		}
	}

	if existed {
		return provider, nil
	}

	return nil, nil
}

// GetModelProviderByApiKey retrieves both the provider and its model provider by API key
func GetModelProviderByApiKey(apiKey string) (model.ModelProvider, error) {
	provider, err := GetProviderByApiKey(apiKey)
	if err != nil {
		return nil, err
	}

	if provider == nil {
		return nil, fmt.Errorf("The provider is not found")
	}

	// Ensure it's a model provider
	if provider.Category != "Model" {
		return nil, fmt.Errorf("The model provider: %s is not found", provider.Name)
	}

	modelProvider, err := provider.GetModelProvider()
	if err != nil {
		return nil, err
	}
	if modelProvider == nil {
		return nil, fmt.Errorf("The model provider: %s is not found", provider.Name)
	}

	return modelProvider, nil
}

func getFilteredProviders(providers []*Provider, needStorage bool) []*Provider {
	res := []*Provider{}
	for _, provider := range providers {
		if (needStorage && provider.Category == "Storage") || (!needStorage && provider.Category != "Storage") {
			res = append(res, provider)
		}
	}
	return res
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

func GetDefaultVideoProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Video"}
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
	provider := Provider{Owner: "admin", Category: "Model", IsDefault: true}
	existed, err := adapter.engine.UseBool().Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.UseBool().Get(&provider)
		if err != nil {
			return &provider, err
		}
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultEmbeddingProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Embedding", IsDefault: true}
	existed, err := adapter.engine.UseBool().Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.UseBool().Get(&provider)
		if err != nil {
			return &provider, err
		}
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultAgentProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Agent", IsDefault: true}
	existed, err := adapter.engine.UseBool().Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.UseBool().Get(&provider)
		if err != nil {
			return &provider, err
		}
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultTextToSpeechProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Text-to-Speech", IsDefault: true}
	existed, err := adapter.engine.UseBool().Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.UseBool().Get(&provider)
		if err != nil {
			return &provider, err
		}
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}

func GetDefaultSpeechToTextProvider() (*Provider, error) {
	provider := Provider{Owner: "admin", Category: "Speech-to-Text"}
	existed, err := adapter.engine.Get(&provider)
	if err != nil {
		return &provider, err
	}

	if providerAdapter != nil && !existed {
		existed, err = providerAdapter.engine.Get(&provider)
		if err != nil {
			return &provider, err
		}
	}

	if !existed {
		return nil, nil
	}

	return &provider, nil
}
