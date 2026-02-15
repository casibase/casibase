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

package model

import (
	"fmt"
	"io"

	"github.com/casibase/casibase/i18n"
)

type BaichuanModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewBaichuanModelProvider(subType string, apiKey string, temperature float32, topP float32) (*BaichuanModelProvider, error) {
	return &BaichuanModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *BaichuanModelProvider) GetPricing() string {
	return `URL:
https://platform.baichuan-ai.com/price

| Model      | sub-type             | Input Price per 1K characters    | Output Price per 1K characters |
|------------|----------------------|----------------------------------|--------------------------------|
| Baichuan   | Baichuan2-Turbo      | 0.008yuan/1,000 tokens           | 0.008yuan/1,000 tokens         |
| Baichuan   | Baichuan2-53B        | 0.010yuan/1,000 tokens           | 0.010yuan/1,000 tokens         |
| Baichuan   | Baichuan3-Turbo      | 0.012yuan/1,000 tokens           | 0.012yuan/1,000 tokens         |
| Baichuan   | Baichuan3-Turbo-128k | 0.024yuan/1,000 tokens           | 0.024yuan/1,000 tokens         |
| Baichuan   | Baichuan4            | 0.100yuan/1,000 tokens           | 0.100yuan/1,000 tokens         |
| Baichuan   | Baichuan4-Air        | 0.00098yuan/1,000 tokens         | 0.00098yuan/1,000 tokens       |
| Baichuan   | Baichuan4-Turbo      | 0.015yuan/1,000 tokens           | 0.015yuan/1,000 tokens         |
`
}

func (p *BaichuanModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"Baichuan2-Turbo":      {0.008, 0.008},
		"Baichuan2-53B":        {0.1, 0.1},
		"Baichuan3-Turbo":      {0.012, 0.012},
		"Baichuan3-Turbo-128k": {0.024, 0.024},
		"Baichuan4":            {0.1, 0.1},
		"Baichuan4-Air":        {0.00098, 0.00098},
		"Baichuan4-Turbo":      {0.015, 0.015},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *BaichuanModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://api.baichuan-ai.com/v1"
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "CNY")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo, lang)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
