// Copyright 2024 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
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
)

type DeepSeekProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewDeepSeekProvider(subType string, apiKey string, temperature float32, topP float32) (*DeepSeekProvider, error) {
	return &DeepSeekProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *DeepSeekProvider) GetPricing() string {
	return `URL:
https://api-docs.deepseek.com/zh-cn/quick_start/pricing

| Model    | sub-type          | Input Price per 1M tokens | Output Price per 1M tokens |
| -------- | ----------------- | ------------------------- | -------------------------- |
| deepseek | deepseek-chat     | 0.5 yuan                  | 12 yuan                    |
| deepseek | deepseek-reasoner | 0.5 yuan                  | 12 yuan                    |
`
}

func (p *DeepSeekProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"deepseek-chat":     {0.5, 12},
		"deepseek-reasoner": {0.5, 12},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *DeepSeekProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	const BaseUrl = "https://api.deepseek.com/v1"

	var localType string
	if p.subType == "deepseek-reasoner" {
		localType = "Custom-think"
	} else if p.subType == "deepseek-chat" {
		localType = "Custom"
	}
	localProvider, err := NewLocalModelProvider(localType, "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "CNY")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
