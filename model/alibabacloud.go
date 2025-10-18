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

type AlibabacloudModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewAlibabacloudModelProvider(subType string, apiKey string, temperature float32, topP float32) (*AlibabacloudModelProvider, error) {
	return &AlibabacloudModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *AlibabacloudModelProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/billing-for-model-studio

| Model                         | sub-type                      | Input Price per 1K tokens  | Output Price per 1K tokens |
|-------------------------------|-------------------------------|----------------------------|----------------------------|
| Qwen-Max                      | qwen-max                      | 0.0024 yuan                | 0.0096 yuan                |
| Qwen-Max-Latest               | qwen-max-latest               | 0.0024 yuan                | 0.0096 yuan                |
| Qwen-Max-2025-01-25           | qwen-max-2025-01-25           | 0.0024 yuan                | 0.0096 yuan                |
| Qwen-Max-2024-09-19           | qwen-max-2024-09-19           | 0.02 yuan                  | 0.06 yuan                  |
| Qwen-Plus                     | qwen-plus                     | 0.0008 yuan                | 0.008 yuan                 |
| Qwen-Plus-2025-07-14          | qwen-plus-2025-07-14          | 0.0008 yuan                | 0.008 yuan                 |
| Qwen-Plus-2025-04-28          | qwen-plus-2025-04-28          | 0.0008 yuan                | 0.008 yuan                 |
| Qwen-Turbo                    | qwen-turbo                    | 0.0003 yuan                | 0.003 yuan                 |
| Qwen-Turbo-Latest             | qwen-turbo-latest             | 0.0003 yuan                | 0.0006 yuan                |
| Qwen-Turbo-2025-07-15         | qwen-turbo-2025-07-15         | 0.0003 yuan                | 0.003 yuan                 |
| Qwen-Turbo-2025-04-28         | qwen-turbo-2025-04-28         | 0.0003 yuan                | 0.0006 yuan                |
| Qwq-Plus                      | qwq-plus                      | 0.0016 yuan                | 0.004 yuan                 |
| Qwq-Plus-Latest               | qwq-plus-latest               | 0.0016 yuan                | 0.004 yuan                 |
| Qwq-Plus-2025-03-05           | qwq-plus-2025-03-05           | 0.0016 yuan                | 0.004 yuan                 |
| Qwen-Long                     | qwen-long                     | 0.0005 yuan                | 0.002 yuan                 |
| Qwen-Long-Latest              | qwen-long-latest              | 0.0005 yuan                | 0.002 yuan                 |
| Qwen-Long-2025-01-25          | qwen-long-2025-01-25          | 0.0005 yuan                | 0.002 yuan                 |
| Qwen3-235b-A22b-Thinking-2507 | qwen3-235b-a22b-thinking-2507 | 0.002 yuan                 | 0.02 yuan                  |
| Qwen3-235b-A22b-Instruct-2507 | qwen3-235b-a22b-instruct-2507 | 0.002 yuan                 | 0.008 yuan                 |
| Qwq-32b                       | qwq-32b                       | 0.002 yuan                 | 0.006 yuan                 |
| Deepseek-V3.1                 | deepseek-v3.1                 | 0.004 yuan                 | 0.012 yuan                 |
| Deepseek-R1                   | deepseek-r1                   | 0.004 yuan                 | 0.016 yuan                 |
| Moonshot-Kimi-K2-Instruct     | Moonshot-Kimi-K2-Instruct     | 0.004 yuan                 | 0.016 yuan                 |
`
}

func (p *AlibabacloudModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"qwen-max":                      {0.0024, 0.0096},
		"qwen-max-latest":               {0.0024, 0.0096},
		"qwen-max-2025-01-25":           {0.0024, 0.0096},
		"qwen-max-2024-09-19":           {0.02, 0.06},
		"qwen-plus":                     {0.0008, 0.008},
		"qwen-plus-2025-07-14":          {0.0008, 0.008},
		"qwen-plus-2025-04-28":          {0.0008, 0.008},
		"qwen-turbo":                    {0.0003, 0.003},
		"qwen-turbo-latest":             {0.0003, 0.0006},
		"qwen-turbo-2025-07-15":         {0.0003, 0.003},
		"qwen-turbo-2025-04-28":         {0.0003, 0.0006},
		"qwq-plus":                      {0.0016, 0.004},
		"qwq-plus-latest":               {0.0016, 0.004},
		"qwq-plus-2025-03-05":           {0.0016, 0.004},
		"qwen-long":                     {0.0005, 0.002},
		"qwen-long-latest":              {0.0005, 0.002},
		"qwen-long-2025-01-25":          {0.0005, 0.002},
		"qwen3-235b-a22b-thinking-2507": {0.002, 0.02},
		"qwen3-235b-a22b-instruct-2507": {0.002, 0.008},
		"qwq-32b":                       {0.002, 0.006},
		"deepseek-v3.1":                 {0.004, 0.012},
		"deepseek-r1":                   {0.004, 0.016},
		"Moonshot-Kimi-K2-Instruct":     {0.004, 0.016},
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

func (p *AlibabacloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "CNY")
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
