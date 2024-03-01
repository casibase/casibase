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

package embedding

import (
	"context"

	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"
)

type CohereEmbeddingProvider struct {
	subType   string
	secretKey string
	inputType string
}

func (p *CohereEmbeddingProvider) GetPricing() string {
	return `URL:
https://cohere.com/pricing

Embedding models:

| Models  | Per 1,000,000 tokens |
|---------|----------------------|
| default | $0.1                 |
`
}

func (p *CohereEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	pricePerThousandTokens := 0.0001
	res.Price = getPrice(res.TokenCount, pricePerThousandTokens)
	res.Currency = "USD"
	return nil
}

func NewCohereEmbeddingProvider(subType string, inputType string, secretKey string) (*CohereEmbeddingProvider, error) {
	return &CohereEmbeddingProvider{
		subType:   subType,
		secretKey: secretKey,
		inputType: inputType,
	}, nil
}

func (c *CohereEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	client := cohereclient.NewClient(
		cohereclient.WithToken(c.secretKey),
	)

	res, embed, err := embed(ctx, client, &c.subType, &c.inputType, []string{text})
	if err != nil {
		return nil, nil, err
	}

	err = c.calculatePrice(res)
	if err != nil {
		return nil, nil, err
	}
	return float64ToFloat32(embed[0]), res, nil
}

func embed(ctx context.Context, client *cohereclient.Client, model *string, inputType *string, texts []string) (*EmbeddingResult, [][]float64, error) {
	resp, err := client.Embed(ctx, &cohere.EmbedRequest{
		Texts:     texts,
		Model:     model,
		InputType: (*cohere.EmbedInputType)(inputType),
	})
	if err != nil {
		return nil, nil, err
	}

	res := &EmbeddingResult{}
	res.TokenCount = int(*resp.EmbeddingsFloats.Meta.BilledUnits.InputTokens)
	embeddings := make([][]float64, len(resp.EmbeddingsFloats.Embeddings))

	for i, embedding := range resp.EmbeddingsFloats.Embeddings {
		embeddings[i] = embedding
	}
	return res, embeddings, nil
}
