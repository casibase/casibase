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

| Model               | sub-type                      | Input Price per 1K characters | Output Price per 1K characters |
| ------------------- | ----------------------------- | ----------------------------- | ------------------------------ |
| Qwen-Max            | qwen-max                      | 0.0024yuan/1,000 tokens       | 0.0096yuan/1,000 tokens        |
| Qwen-Qlus           | qwen-plus                     | 0.0008yuan/1,000 tokens       | 0.008yuan/1,000 tokens         |
| Qwen-Turbo          | qwen-turbo                    | 0.0003yuan/1,000 tokens       | 0.003yuan/1,000 tokens         |
| Qwq-Plus            | qwq-plus                      | 0.0016yuan/1,000 tokens       | 0.004yuan/1,000 tokens         |
| Qwen-Long           | qwen-long                     | 0.0005yuan/1,000 tokens       | 0.002yuan/1,000 tokens         |
| Qwen3               | qwen3-235b-a22b-thinking-2507 | 0.002yuan/1,000 tokens        | 0.02yuan/1,000 tokens          |
| Qwen3               | qwen3-235b-a22b-instruct-2507 | 0.002yuan/1,000 tokens        | 0.008yuan/1,000 tokens         |
| Qwen3               | qwen3-30b-a3b-thinking-2507   | 0.00075yuan/1,000 tokens      | 0.0075yuan/1,000 tokens        |
| Qwen3               | qwen3-30b-a3b-instruct-2507   | 0.00075yuan/1,000 tokens      | 0.003yuan/1,000 tokens         |
| Qwen3               | qwen3-32b                     | 0.002yuan/1,000 tokens        | 0.02yuan/1,000 tokens          |
| Qwen3               | qwen3-30b-a3b                 | 0.00075yuan/1,000 tokens      | 0.0075yuan/1,000 tokens        |
| Qwen3               | qwen3-14b                     | 0.001yuan/1,000 tokens        | 0.01yuan/1,000 tokens          |
| Qwen3               | qwen3-8b                      | 0.0005yuan/1,000 tokens       | 0.005yuan/1,000 tokens         |
| Qwen3               | qwen3-4b                      | 0.0003yuan/1,000 tokens       | 0.003yuan/1,000 tokens         |
| Qwen3               | qwen3-1.7b                    | 0.0003yuan/1,000 tokens       | 0.003yuan/1,000 tokens         |
| Qwen3               | qwen3-0.6b                    | 0.0003yuan/1,000 tokens       | 0.003yuan/1,000 tokens         |
| QwQ                 | qwq-32b                       | 0.002yuan/1,000 tokens        | 0.006yuan/1,000 tokens         |
| DeepSeek-V3.1       | deepseek-v3.1                 | 0.004yuan/1,000 tokens        | 0.012yuan/1,000 tokens         |
| DeepSeek-R1         | deepseek-r1                   | 0.004yuan/1,000 tokens        | 0.016yuan/1,000 tokens         |
| DeepSeek-V3         | deepseek-v3                   | 0.002yuan/1,000 tokens        | 0.008yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-7b   | 0.0005yuan/1,000 tokens       | 0.001yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-14b  | 0.001yuan/1,000 tokens        | 0.003yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-32b  | 0.002yuan/1,000 tokens        | 0.006yuan/1,000 tokens         |
| Kimi-K2             | Moonshot-Kimi-K2-Instruct     | 0.004yuan/1,000 tokens        | 0.016yuan/1,000 tokens         |
`
}

func (p *AlibabacloudModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"qwen-max":                      {0.0024, 0.0096},
		"qwen-plus":                     {0.0008, 0.008},
		"qwen-turbo":                    {0.0003, 0.003},
		"qwq-plus":                      {0.0016, 0.004},
		"qwen-long":                     {0.0005, 0.002},
		"qwen3-235b-a22b-thinking-2507": {0.002, 0.02},
		"qwen3-235b-a22b-instruct-2507": {0.002, 0.008},
		"qwen3-30b-a3b-thinking-2507":   {0.00075, 0.0075},
		"qwen3-30b-a3b-instruct-2507":   {0.00075, 0.003},
		"qwen3-32b":                     {0.002, 0.02},
		"qwen3-30b-a3b":                 {0.00075, 0.0075},
		"qwen3-14b":                     {0.001, 0.01},
		"qwen3-8b":                      {0.0005, 0.005},
		"qwen3-4b":                      {0.0003, 0.003},
		"qwen3-1.7b":                    {0.0003, 0.003},
		"qwen3-0.6b":                    {0.0003, 0.003},
		"qwq-32b":                       {0.002, 0.006},
		"deepseek-v3.1":                 {0.004, 0.012},
		"deepseek-r1":                   {0.004, 0.016},
		"deepseek-v3":                   {0.002, 0.008},
		"deepseek-r1-distill-qwen-7b":   {0.0005, 0.001},
		"deepseek-r1-distill-qwen-14b":  {0.001, 0.003},
		"deepseek-r1-distill-qwen-32b":  {0.002, 0.006},
		"Moonshot-Kimi-K2-Instruct":     {0.004, 0.016},
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

func (p *AlibabacloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	const BaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "CNY")
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
