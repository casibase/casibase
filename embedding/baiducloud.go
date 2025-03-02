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

package embedding

import (
	"context"

	"github.com/baidubce/bce-qianfan-sdk/go/qianfan"
)

type BaiduCloudEmbeddingProvider struct {
	subType   string
	apiKey    string
	secretKey string
}

func NewBaiduCloudEmbeddingProvider(subType string, apiKey string, secretKey string) (*BaiduCloudEmbeddingProvider, error) {
	return &BaiduCloudEmbeddingProvider{subType: subType, apiKey: apiKey, secretKey: secretKey}, nil
}

func (p *BaiduCloudEmbeddingProvider) GetPricing() string {
	return `URL:
https://cloud.baidu.com/article/517050

Embedding Models:

| Module       | Service Type                                                   | Price per 1K tokens (CNY) |
|------------  |----------------------------------------------------------------|---------------------------|
| Embedding-V1 | Public Cloud Online Invocation Service                         | 0.0005                    |
| bge-large-zh | Embedding-V1 Public Cloud Online Invocation Experience Service | 0.0005                    |
| bge-large-en | Embedding-V1 Public Cloud Online Invocation Experience Service | 0.0005                    |
| tao-8k       | Embedding-V1 Public Cloud Online Invocation Experience Service | 0.0005                    |
`
}

func (p *BaiduCloudEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	priceTable := map[string]float64{
		"Embedding-V1": 0.0005,
		"bge-large-zh": 0.0005,
		"bge-large-en": 0.0005,
		"tao-8k":       0.0005,
	}
	res.Price = getPrice(res.TokenCount, priceTable[p.subType])
	res.Currency = "CNY"
	return nil
}

func (p *BaiduCloudEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	qianfan.GetConfig().AccessKey = p.apiKey
	qianfan.GetConfig().SecretKey = p.secretKey

	embed := qianfan.NewEmbedding(
		qianfan.WithModel(p.subType),
	)

	resp, err := embed.Do(
		ctx,
		&qianfan.EmbeddingRequest{
			Input: []string{text},
		},
	)
	if err != nil {
		return nil, nil, err
	}
	embeddingResult := &EmbeddingResult{TokenCount: resp.Usage.TotalTokens}

	err = p.calculatePrice(embeddingResult)
	if err != nil {
		return nil, nil, err
	}
	vector := float64ToFloat32(resp.Data[0].Embedding)

	return vector, embeddingResult, nil
}
