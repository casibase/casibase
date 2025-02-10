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

	ernie "github.com/anhao/go-ernie"
)

type ErnieEmbeddingProvider struct {
	subType   string
	apiKey    string
	secretKey string
}

func NewErnieEmbeddingProvider(subType string, apiKey string, secretKey string) (*ErnieEmbeddingProvider, error) {
	return &ErnieEmbeddingProvider{subType: subType, apiKey: apiKey, secretKey: secretKey}, nil
}

func (e *ErnieEmbeddingProvider) GetPricing() string {
	return `URL:
https://cloud.baidu.com/article/517050

Embedding Models:

| Module     | Service Type                                        | Price (Per 1000 tokens) |
|------------|-----------------------------------------------------|-------------------------|
| Prediction | Embedding-V1 Public Cloud Online Invocation Service | ¥0.002/thousand tokens  |
`
}

func (p *ErnieEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	pricePerThousandTokens := 0.002
	res.Price = getPrice(res.TokenCount, pricePerThousandTokens)
	res.Currency = "CNY"
	return nil
}

func (p *ErnieEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	client := ernie.NewDefaultClient(p.apiKey, p.secretKey)

	request := ernie.EmbeddingRequest{Input: []string{text}}
	embeddings, err := client.CreateEmbeddings(ctx, request)
	if err != nil {
		return nil, nil, err
	}

	embeddingResult := &EmbeddingResult{TokenCount: embeddings.Usage.TotalTokens}

	err = p.calculatePrice(embeddingResult)
	if err != nil {
		return nil, nil, err
	}

	vector := float64ToFloat32(embeddings.Data[0].Embedding)
	return vector, embeddingResult, nil
}
