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

package tts

import (
	"context"

	"github.com/casibase/casibase/model"
)

type TTSResult struct {
	TokenCount int
	Price      float64
	Currency   string
}

type TTSProvider interface {
	GetPricing() string
	QuerySpeech(text string, ctx context.Context) ([]byte, *TTSResult, error)
}

func GetTTSProvider(typ string, subType string, clientId string, clientSecret string, providerUrl string, apiVersion string, pricePerThousandChars float64, currency string, flavor string) (TTSProvider, error) {
	var p TTSProvider
	var err error

	if typ == "Alibaba Cloud" {
		p, err = NewAlibabacloudTTSProvider(typ, subType, clientSecret, flavor)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}

func GetDefaultTTSResult(modelSubType string, text string) (*TTSResult, error) {
	tokenCount, err := model.GetTokenSize(modelSubType, text)
	if err != nil {
		tokenCount, err = model.GetTokenSize("text-embedding-ada-002", text)
	}
	if err != nil {
		return nil, err
	}
	price := getPrice(tokenCount, 0.0006)
	currency := "CNY"

	res := &TTSResult{
		TokenCount: tokenCount,
		Price:      price,
		Currency:   currency,
	}
	return res, nil
}
