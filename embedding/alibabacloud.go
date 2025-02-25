// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
)

type AlibabacloudEmbeddingProvider struct {
	typ         string
	subType     string
	secretKey   string
	providerUrl string
}

func NewAlibabacloudEmbeddingProvider(typ string, subType string, secretKey string, providerUrl string) (*AlibabacloudEmbeddingProvider, error) {
	return &AlibabacloudEmbeddingProvider{
		typ:         typ,
		subType:     subType,
		secretKey:   secretKey,
		providerUrl: providerUrl,
	}, nil
}

func (p *AlibabacloudEmbeddingProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/user-guide/embedding?spm=a2c4g.11186623.help-menu-search-2400256.d_0

Embedding models:

|    Models         |     Per 1,000 tokens   |
|-------------------|----------------------- |
| text-embedding-v1 |  0.0007 yuan/1k token  |
| text-embedding-v2 |  0.0007 yuan/1k token  |  
| text-embedding-v3 |  0.0007 yuan/1k token  |                  
`
}

func (p *AlibabacloudEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	pricePerThousandTokens := 0.0007
	res.Price = getPrice(res.TokenCount, pricePerThousandTokens)
	res.Currency = "yuan"
	return nil
}

func (p *AlibabacloudEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	localEmbeddingProvider, err := NewLocalEmbeddingProvider("Custom", p.subType, p.secretKey, p.providerUrl)
	if err != nil {
		return nil, nil, err
	}
	vector, embeddingResult, err := localEmbeddingProvider.QueryVector(text, ctx)
	if err != nil {
		return nil, nil, err
	}
	return vector, embeddingResult, nil
}
