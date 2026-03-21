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

package image

import "io"

type TextToImageResult struct {
	ImageCount int
	Price      float64
	Currency   string
}

type TextToImageProvider interface {
	GetPricing() string
	QueryImage(prompt string, writer io.Writer, lang string) (*TextToImageResult, error)
}

func GetTextToImageProvider(typ string, subType string, clientSecret string, providerUrl string, inputPricePerImage float64, currency string) (TextToImageProvider, error) {
	var p TextToImageProvider
	var err error

	if typ == "OpenAI" {
		p, err = NewOpenAITextToImageProvider(subType, clientSecret, inputPricePerImage, currency)
	} else if typ == "Silicon Flow" {
		if providerUrl == "" {
			providerUrl = "https://api.siliconflow.cn/v1"
		}
		p, err = NewCustomTextToImageProvider(subType, clientSecret, providerUrl, inputPricePerImage, currency)
	} else if typ == "Custom" {
		p, err = NewCustomTextToImageProvider(subType, clientSecret, providerUrl, inputPricePerImage, currency)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}
