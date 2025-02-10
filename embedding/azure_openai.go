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

package embedding

import (
	"github.com/casibase/casibase/proxy"
	"github.com/sashabaranov/go-openai"
)

func NewAzureEmbeddingProvider(typ string, subType string, deploymentName string, secretKey string, providerUrl string, apiVersion string) (*LocalEmbeddingProvider, error) {
	p := &LocalEmbeddingProvider{
		typ:            typ,
		subType:        subType,
		deploymentName: deploymentName,
		secretKey:      secretKey,
		providerUrl:    providerUrl,
		apiVersion:     apiVersion,
	}
	return p, nil
}

func getAzureClientFromToken(deploymentName string, authToken string, url string, apiVersion string) *openai.Client {
	config := openai.DefaultAzureConfig(authToken, url)
	config.HTTPClient = proxy.ProxyHttpClient
	if apiVersion != "" {
		config.APIVersion = apiVersion
	}
	if deploymentName != "" {
		config.AzureModelMapperFunc = func(model string) string {
			azureModelMapping := map[string]string{
				model: deploymentName,
			}
			return azureModelMapping[model]
		}
	}

	c := openai.NewClientWithConfig(config)
	return c
}
