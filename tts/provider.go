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
	"io"
)

type TextToSpeechResult struct {
	TokenCount int
	Price      float64
	Currency   string
}

type TextToSpeechProvider interface {
	GetPricing() string
	QueryAudio(text string, ctx context.Context) ([]byte, *TextToSpeechResult, error)
	QueryAudioStream(text string, ctx context.Context, writer io.Writer) (*TextToSpeechResult, error)
}

func GetTextToSpeechProvider(typ string, subType string, clientId string, clientSecret string, providerUrl string, apiVersion string, pricePerThousandChars float64, currency string, flavor string) (TextToSpeechProvider, error) {
	var p TextToSpeechProvider
	var err error

	if typ == "Alibaba Cloud" {
		p, err = NewAlibabacloudTextToSpeechProvider(typ, subType, clientSecret, flavor)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}
