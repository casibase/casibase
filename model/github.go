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

package model

import (
	"github.com/casibase/casibase/proxy"
	"github.com/sashabaranov/go-openai"
)

type GitHubModelProvider struct {
	*LocalModelProvider
}

func NewGitHubModelProvider(typ string, subType string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32) (*GitHubModelProvider, error) {
	p := &GitHubModelProvider{
		LocalModelProvider: &LocalModelProvider{
			typ:                "Custom",
			subType:            "custom-model",
			secretKey:          secretKey,
			temperature:        temperature,
			topP:               topP,
			frequencyPenalty:   frequencyPenalty,
			presencePenalty:    presencePenalty,
			providerUrl:        "https://models.github.ai/inference",
			compitableProvider: subType,
		},
	}
	return p, nil
}

func getGitHubClientFromToken(authToken string, providerUrl string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.BaseURL = providerUrl
	config.HTTPClient = proxy.ProxyHttpClient

	c := openai.NewClientWithConfig(config)
	return c
}

func (p *GitHubModelProvider) GetPricing() string {
	return `GitHub model API usage are free but rate limited by requests per minute, requests per day, tokens per request, and concurrent requests.
URL:
https://docs.github.com/en/github-models/prototyping-with-ai-models#rate-limits
`
}

func (p *GitHubModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	modelResult.TotalPrice = price
	modelResult.Currency = "USD"
	return nil
}
