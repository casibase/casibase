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

package model

import (
	"github.com/casibase/casibase/proxy"
	"github.com/sashabaranov/go-openai"
)

func GetModeByAzureSubType(subType string) string {
	chatModels := []string{
		"gpt-4-32k-0613", "gpt-4-32k-0314", "gpt-4-32k",
		"gpt-4-0613", "gpt-4-0314", "gpt-4", "gpt-3.5-turbo-0613",
		"gpt-3.5-turbo-0301", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-0613",
		"gpt-3.5-turbo",
	}

	completionModels := []string{
		"text-davinci-003", "text-davinci-002", "text-curie-001",
		"text-babbage-001", "text-ada-001", "text-davinci-001",
		"davinci-instruct-beta", "davinci", "curie-instruct-beta", "curie", "ada", "babbage",
	}

	for _, chatModel := range chatModels {
		if subType == chatModel {
			return "chat"
		}
	}

	for _, completionModel := range completionModels {
		if subType == completionModel {
			return "completion"
		}
	}

	return "unknown"
}

func NewAzureModelProvider(typ string, subType string, deploymentName string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32, providerUrl string, apiVersion string) (*LocalModelProvider, error) {
	p := &LocalModelProvider{
		typ:              typ,
		subType:          subType,
		deploymentName:   deploymentName,
		secretKey:        secretKey,
		temperature:      temperature,
		topP:             topP,
		frequencyPenalty: frequencyPenalty,
		presencePenalty:  presencePenalty,
		providerUrl:      providerUrl,
		apiVersion:       apiVersion,
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
