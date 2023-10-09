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

package controllers

import (
	"fmt"

	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func (c *ApiController) ResponseErrorStream(errorText string) {
	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", errorText)
	_, err := c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func getModelProviderFromContext(owner string, name string) (*object.Provider, model.ModelProvider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := object.GetDefaultStore(owner)
		if err != nil {
			return nil, nil, err
		}

		if store != nil && store.ModelProvider != "" {
			providerName = store.ModelProvider
		}
	}

	var provider *object.Provider
	var err error
	if providerName != "" {
		providerId := util.GetIdFromOwnerAndName(owner, providerName)
		provider, err = object.GetProvider(providerId)
	} else {
		provider, err = object.GetDefaultModelProvider()
	}

	if provider == nil && err == nil {
		return nil, nil, fmt.Errorf("The model provider: %s is not found", providerName)
	}
	if provider.Category != "Model" || provider.ClientSecret == "" {
		return nil, nil, fmt.Errorf("The model provider: %s is invalid", providerName)
	}

	providerObj, err := provider.GetModelProvider()
	if err != nil {
		return nil, nil, err
	}

	return provider, providerObj, err
}

func getEmbeddingProviderFromContext(owner string, name string) (*object.Provider, embedding.EmbeddingProvider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := object.GetDefaultStore(owner)
		if err != nil {
			return nil, nil, err
		}

		if store != nil && store.EmbeddingProvider != "" {
			providerName = store.EmbeddingProvider
		}
	}

	var provider *object.Provider
	var err error
	if providerName != "" {
		providerId := util.GetIdFromOwnerAndName(owner, providerName)
		provider, err = object.GetProvider(providerId)
	} else {
		provider, err = object.GetDefaultEmbeddingProvider()
	}

	if provider == nil && err == nil {
		return nil, nil, fmt.Errorf("The embedding provider: %s is not found", providerName)
	}
	if provider.Category != "Embedding" || provider.ClientSecret == "" {
		return nil, nil, fmt.Errorf("The embedding provider: %s is invalid", providerName)
	}

	providerObj, err := provider.GetEmbeddingProvider()
	if err != nil {
		return nil, nil, err
	}

	return provider, providerObj, err
}
