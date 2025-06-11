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

	"github.com/casibase/casibase/proxy"
	"google.golang.org/genai"
)

type GeminiEmbeddingProvider struct {
	subType   string
	secretKey string
}

func NewGeminiEmbeddingProvider(subType string, secretKey string) (*GeminiEmbeddingProvider, error) {
	p := &GeminiEmbeddingProvider{
		subType:   subType,
		secretKey: secretKey,
	}
	return p, nil
}

func (p *GeminiEmbeddingProvider) GetPricing() string {
	return `URL:
https://cloud.google.com/vertex-ai/generative-ai/pricing

Embedding Models:

| Model                | Output Price          |
|----------------------|-----------------------|
| multimodalembeddings | $0.0002/1K characters |
	`
}

func (p *GeminiEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	pricePerThousandTokens := 0.0002
	res.Price = getPrice(res.TokenCount, pricePerThousandTokens)
	res.Currency = "USD"
	return nil
}

func (p *GeminiEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	// Access your API key as an environment variable (see "Set up your API key" above)
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:     p.secretKey,
		Backend:    genai.BackendGeminiAPI,
		HTTPClient: proxy.ProxyHttpClient,
	})
	if err != nil {
		return nil, nil, err
	}

	contents := []*genai.Content{
		genai.NewContentFromText(text, genai.RoleUser),
	}

	em := client
	res, err := em.Models.EmbedContent(ctx, p.subType, contents, nil)
	if err != nil {
		return nil, nil, err
	}

	embeddingResult := &EmbeddingResult{TokenCount: 0}
	err = p.calculatePrice(embeddingResult)
	if err != nil {
		return nil, nil, err
	}

	vector := res.Embeddings[0].Values
	return vector, embeddingResult, nil
}
