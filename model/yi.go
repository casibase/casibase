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

package model

import (
	"fmt"
	"io"

	"github.com/casibase/casibase/i18n"
)

type YiProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewYiProvider(subType string, apiKey string, temperature float32, topP float32) (*YiProvider, error) {
	return &YiProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *YiProvider) GetPricing() string {
	return `URL:
https://platform.lingyiwanwu.com
    
| Model          | Context Window | Input Price (per 1M tokens) | Output Price (per 1M tokens) |
|----------------|---------------|---------------------------|----------------------------|
| yi-lightning   | 16K          | ¥0.99                    | ¥0.99                     |
| yi-vision-v2   | 16K          | ¥6.00                    | ¥6.00                     |`
}

func (p *YiProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	// Price table (price per 1000 tokens in CNY)
	priceTable := map[string][2]float64{
		"yi-lightning": {0.00099, 0.00099},
		"yi-vision-v2": {0.006, 0.006},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		modelResult.TotalPrice = inputPrice + outputPrice
		modelResult.Currency = "CNY"
		return nil
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}
}

func (p *YiProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	// Configure Yi API client
	const BaseUrl = "https://api.lingyiwanwu.com/v1"

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
