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

	"github.com/casibase/casibase/model"
)

type EmbeddingResult struct {
	TokenCount int
	Price      float64
	Currency   string
}

type EmbeddingProvider interface {
	GetPricing() string
	QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error)
}

func GetEmbeddingProvider(typ string, subType string, clientId string, clientSecret string, providerUrl string, apiVersion string, pricePerThousandTokens float64, currency string) (EmbeddingProvider, error) {
	var p EmbeddingProvider
	var err error
	if typ == "OpenAI" {
		p, err = NewOpenAiEmbeddingProvider(typ, subType, clientSecret)
	} else if typ == "Gemini" {
		p, err = NewGeminiEmbeddingProvider(subType, clientSecret)
	} else if typ == "Hugging Face" {
		p, err = NewHuggingFaceEmbeddingProvider(subType, clientSecret)
	} else if typ == "Cohere" {
		p, err = NewCohereEmbeddingProvider(subType, clientId, clientSecret)
	} else if typ == "Baidu Cloud" {
		p, err = NewBaiduCloudEmbeddingProvider(subType, clientId, clientSecret)
	} else if typ == "Ollama" {
		p, err = NewLocalEmbeddingProvider(typ, subType, "randomString", providerUrl, pricePerThousandTokens, currency)
	} else if typ == "Local" {
		p, err = NewLocalEmbeddingProvider(typ, subType, clientSecret, providerUrl, pricePerThousandTokens, currency)
	} else if typ == "Azure" {
		p, err = NewAzureEmbeddingProvider(typ, subType, clientId, clientSecret, providerUrl, apiVersion)
	} else if typ == "MiniMax" {
		p, err = NewMiniMaxEmbeddingProvider(typ, subType, clientSecret, providerUrl)
	} else if typ == "Alibaba Cloud" {
		p, err = NewAlibabacloudEmbeddingProvider(typ, subType, clientSecret, providerUrl)
	} else if typ == "Tencent Cloud" {
		p, err = NewTencentCloudEmbeddingProvider(clientId, clientSecret)
	} else if typ == "Jina" {
		p, err = NewJinaEmbeddingProvider(subType, clientSecret)
	} else if typ == "Word2Vec" {
		p, err = NewWord2VecEmbeddingProvider(typ, subType)
	} else if typ == "Dummy" {
		p, err = NewDummyEmbeddingProvider(subType)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}

func GetDefaultEmbeddingResult(modelSubType string, text string) (*EmbeddingResult, error) {
	tokenCount, err := model.GetTokenSize(modelSubType, text)
	if err != nil {
		tokenCount, err = model.GetTokenSize("text-embedding-ada-002", text)
	}
	if err != nil {
		return nil, err
	}

	price := getPrice(tokenCount, 0.0001)
	currency := "USD"

	res := &EmbeddingResult{
		TokenCount: tokenCount,
		Price:      price,
		Currency:   currency,
	}
	return res, nil
}
