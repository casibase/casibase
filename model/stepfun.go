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

	"github.com/casibase/casibase/i18n"
)

type StepFunModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewStepFunModelProvider(subType string, apiKey string, temperature float32, topP float32) (*StepFunModelProvider, error) {
	return &StepFunModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *StepFunModelProvider) GetPricing() string {
	return `URL:
https://platform.stepfun.com/docs/pricing/details

| Model        | Input Price per 1K characters    | Output Price per 1K characters |
|--------------|----------------------------------|--------------------------------|
| step-1-8k    | 0.005yuan/1,000 tokens           | 0.02yuan/1,000 tokens          |
| step-1-32k   | 0.015yuan/1,000 tokens           | 0.07yuan/1,000 tokens          |
| step-1-256k  | 0.095yuan/1,000 tokens           | 0.3yuan/1,000 tokens           |
| step-2-mini  | 0.001yuan/1,000 tokens           | 0.002yuan/1,000 tokens         |
| step-2-16k   | 0.038yuan/1,000 tokens           | 0.12yuan/1,000 tokens          |
| step-2-16k-exp   | 0.038yuan/1,000 tokens       | 0.12yuan/1,000 tokens          |
`
}

func (p *StepFunModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"step-1-8k":      {0.005, 0.02},
		"step-1-32k":     {0.015, 0.07},
		"step-1-256k":    {0.095, 0.3},
		"step-2-mini":    {0.001, 0.002},
		"step-2-16k":     {0.038, 0.12},
		"step-2-16k-exp": {0.038, 0.12},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *StepFunModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://api.stepfun.com/v1"
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
