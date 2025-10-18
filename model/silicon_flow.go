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

type SiliconFlowProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewSiliconFlowProvider(subType string, apiKey string, temperature float32, topP float32) (*SiliconFlowProvider, error) {
	return &SiliconFlowProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *SiliconFlowProvider) GetPricing() string {
	return `URL:
https://cloud.siliconflow.cn/models

| Model       | sub-type                             | Input Price per 1K characters | Output Price per 1K characters |
| ----------- | ------------------------------------ | ----------------------------- | ------------------------------ |
| DeepSeek    | deepseek-ai/DeepSeek-V3.1            | 0.00400yuan                   | 0.01200yuan                    |
| DeepSeek    | Pro/deepseek-ai/DeepSeek-V3.1        | 0.00400yuan                   | 0.01200yuan                    |
| DeepSeek    | deepseek-ai/DeepSeek-R1              | 0.00400yuan                   | 0.01600yuan                    |
| DeepSeek    | Pro/deepseek-ai/DeepSeek-R1          | 0.00400yuan                   | 0.01600yuan                    |
| DeepSeek    | deepseek-ai/DeepSeek-V3              | 0.00200yuan                   | 0.00800yuan                    |
| DeepSeek    | Pro/deepseek-ai/DeepSeek-V3          | 0.00200yuan                   | 0.00800yuan                    |
| Kimi        | moonshotai/Kimi-K2-Instruct-0905     | 0.00400yuan                   | 0.01600yuan                    |
| Kimi        | Pro/moonshotai/Kimi-K2-Instruct-0905 | 0.00400yuan                   | 0.01600yuan                    |
| inclusionAI | inclusionAI/Ling-mini-2.0            | 0.0005yuan                    | 0.00200yuan                    |
| ByteDance   | ByteDance-Seed/Seed-OSS-36B-Instruct | 0.0015yuan                    | 0.00400yuan                    |
| zai         | zai-org/GLM-4.5                      | 0.0035yuan                    | 0.01400yuan                    |
| zai         | zai-org/GLM-4.5-Air                  | 0.00100yuan                   | 0.00600yuan                    |
`
}

func (p *SiliconFlowProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"deepseek-ai/DeepSeek-V3.1":            {0.00400, 0.01200},
		"Pro/deepseek-ai/DeepSeek-V3.1":        {0.00400, 0.01200},
		"deepseek-ai/DeepSeek-R1":              {0.00400, 0.01600},
		"Pro/deepseek-ai/DeepSeek-R1":          {0.00400, 0.01600},
		"deepseek-ai/DeepSeek-V3":              {0.00200, 0.00800},
		"Pro/deepseek-ai/DeepSeek-V3":          {0.00200, 0.00800},
		"moonshotai/Kimi-K2-Instruct-0905":     {0.00400, 0.01600},
		"Pro/moonshotai/Kimi-K2-Instruct-0905": {0.00400, 0.01600},
		"inclusionAI/Ling-mini-2.0":            {0.0005, 0.00200},
		"ByteDance-Seed/Seed-OSS-36B-Instruct": {0.0015, 0.00400},
		"zai-org/GLM-4.5":                      {0.0035, 0.01400},
		"zai-org/GLM-4.5-Air":                  {0.00100, 0.00600},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "model:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *SiliconFlowProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://api.siliconflow.cn/v1"
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "USD")
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
