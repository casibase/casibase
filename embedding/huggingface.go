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
	"github.com/henomis/lingoose/embedder/huggingface"
)

type HuggingFaceEmbeddingProvider struct {
	subType   string
	secretKey string
}

func NewHuggingFaceEmbeddingProvider(subType string, secretKey string) (*HuggingFaceEmbeddingProvider, error) {
	return &HuggingFaceEmbeddingProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *HuggingFaceEmbeddingProvider) GetPricing() string {
	return `URL:
https://huggingface.co/pricing

Not charged
`
}

func (p *HuggingFaceEmbeddingProvider) calculatePrice(res *EmbeddingResult) error {
	return nil
}

func (p *HuggingFaceEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	client := huggingfaceembedder.New().WithToken(p.secretKey).WithModel(p.subType).WithHTTPClient(proxy.ProxyHttpClient)
	embed, err := client.Embed(ctx, []string{text})
	if err != nil {
		return nil, nil, err
	}

	embeddingResult, err := GetDefaultEmbeddingResult(p.subType, text)
	if err != nil {
		return nil, nil, err
	}

	err = p.calculatePrice(embeddingResult)
	if err != nil {
		return nil, nil, err
	}

	vector := float64ToFloat32(embed[0])
	return vector, embeddingResult, nil
}
