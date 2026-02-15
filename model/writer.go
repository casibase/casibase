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

type WriterModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewWriterModelProvider(subType string, apiKey string, temperature float32, topP float32) (*WriterModelProvider, error) {
	return &WriterModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *WriterModelProvider) GetPricing() string {
	return `URL:
https://writer.com/pricing/

| Model                    | Input Price per 1M tokens | Output Price per 1M tokens |
|--------------------------|---------------------------|----------------------------|
| Palmyra X5               | $0.60                     | $6.00                      |
| Palmyra X4               | $2.50                     | $10.00                     |
| Palmyra Med              | $2.50                     | $10.00                     |
| Palmyra Fin              | $2.50                     | $10.00                     |
| Palmyra Creative         | $2.50                     | $10.00                     |
`
}

func (p *WriterModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64

	priceTable := map[string][2]float64{
		"palmyra-x5":       {0.0006, 0.006}, // $0.60/$6.00 per 1M tokens
		"palmyra-x4":       {0.0025, 0.010}, // $2.50/$10.00 per 1M tokens
		"palmyra-med":      {0.0025, 0.010}, // $2.50/$10.00 per 1M tokens
		"palmyra-fin":      {0.0025, 0.010}, // $2.50/$10.00 per 1M tokens
		"palmyra-creative": {0.0025, 0.010}, // $2.50/$10.00 per 1M tokens
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPricePerThousandTokens = priceItem[0]
		outputPricePerThousandTokens = priceItem[1]
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	modelResult.Currency = "USD"
	return nil
}

func (p *WriterModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://api.writer.com/v1"

	// Create a LocalModelProvider to handle the OpenAI-compatible API
	localProvider, err := NewLocalModelProvider("Custom", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "USD")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo, lang)
	if err != nil {
		return nil, err
	}

	// Override price calculation with Writer-specific pricing
	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
