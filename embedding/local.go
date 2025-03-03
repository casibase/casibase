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
	"context"
	"fmt"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type LocalEmbeddingProvider struct {
	typ            string
	subType        string
	deploymentName string
	secretKey      string
	providerUrl    string
	apiVersion     string
}

func NewLocalEmbeddingProvider(typ string, subType string, secretKey string, providerUrl string) (*LocalEmbeddingProvider, error) {
	p := &LocalEmbeddingProvider{
		typ:         typ,
		subType:     subType,
		secretKey:   secretKey,
		providerUrl: providerUrl,
	}
	return p, nil
}

func getLocalClientFromUrl(authToken string, url string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.BaseURL = url

	c := openai.NewClientWithConfig(config)
	return c
}

func (p *LocalEmbeddingProvider) GetPricing() string {
	return `URL:
https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

Embedding models:

| Models                   | Per 1,000 tokens |
|--------------------------|------------------|
| Ada                      | $0.0001          |
| text-embedding-3-large   | $0.00013         |
| text-embedding-3-small   | $0.00002         |
`
}

func (p *LocalEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	embeddingModel := p.subType
	var pricePerThousandTokens float64
	switch {
	case strings.Contains(embeddingModel, "text-embedding-ada-002"):
		pricePerThousandTokens = 0.0001
	case strings.Contains(embeddingModel, "text-embedding-3-small"):
		pricePerThousandTokens = 0.00002
	case strings.Contains(embeddingModel, "text-embedding-3-large"):
		pricePerThousandTokens = 0.00013
	case embeddingModel == "custom-embedding":
		pricePerThousandTokens = 0.0001
	default:
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", embeddingModel)
	}

	res.Price = getPrice(res.TokenCount, pricePerThousandTokens)
	res.Currency = "USD"
	return nil
}

func (p *LocalEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	var client *openai.Client
	if p.typ == "Local" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
	} else if p.typ == "Azure" {
		client = getAzureClientFromToken(p.deploymentName, p.secretKey, p.providerUrl, p.apiVersion)
	} else if p.typ == "OpenAI" {
		client = getProxyClientFromToken(p.secretKey)
	} else if p.typ == "Custom" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
	}

	resp, err := client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.EmbeddingModel(p.subType),
	})
	if err != nil {
		return nil, nil, err
	}

	tokenCount := resp.Usage.PromptTokens
	embeddingResult := &EmbeddingResult{TokenCount: tokenCount}

	if p.typ != "Custom" {
		err = p.calculatePrice(embeddingResult)
		if err != nil {
			return nil, nil, err
		}
	}

	vector := resp.Data[0].Embedding
	return vector, embeddingResult, nil
}
