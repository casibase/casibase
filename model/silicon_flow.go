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

| Model      | sub-type             					   | Input Price per 1K characters     | Output Price per 1K characters   |
|------------|---------------------------------------------|-----------------------------------|----------------------------------|
| DeepSeek   | deepseek-ai/DeepSeek-R1      			   | 0.00400yuan/1,000 tokens          | 0.01600yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-V3					   | 0.00200yuan/1,000 tokens          | 0.00800yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-R1-Distill-Llama-70B   | 0.00413yuan/1,000 tokens          | 0.00413yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-R1-Distill-Qwen-32B	   | 0.00126yuan/1,000 tokens          | 0.00126yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-R1-Distill-Qwen-14B	   | 0.00070yuan/1,000 tokens          | 0.00070yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-R1-Distill-Llama-8B    | 0.00000yuan/1,000 tokens		   | 0.00000yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-R1-Distill-Qwen-7B     | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
| DeepSeek   | deepseek-ai/DeepSeek-V2.5      			   | 0.00133yuan/1,000 tokens          | 0.00133yuan/1,000 tokens         |
| Meta-Llama | meta-llama/Llama-3.3-70B-Instruct		   | 0.00413yuan/1,000 tokens          | 0.00413yuan/1,000 tokens         |
| Meta-Llama | meta-llama/Meta-Llama-3.1-405B-Instruct     | 0.02100yuan/1,000 tokens          | 0.02100yuan/1,000 tokens         |
| Meta-Llama | meta-llama/Meta-Llama-3.1-70B-Instruct      | 0.00413yuan/1,000 tokens          | 0.00413yuan/1,000 tokens         |
| Meta-Llama | meta-llama/Meta-Llama-3.1-8B-Instruct       | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
| Qwen	 	 | Qwen/Qwen2.5-72B-Instruct				   | 0.00413yuan/1,000 tokens          | 0.00413yuan/1,000 tokens         |
| Qwen   	 | Qwen/Qwen2.5-32B-Instruct      			   | 0.00126yuan/1,000 tokens          | 0.00126yuan/1,000 tokens         |
| Qwen   	 | Qwen/Qwen2.5-14B-Instruct      			   | 0.00070yuan/1,000 tokens          | 0.00070yuan/1,000 tokens         |
| Qwen   	 | Qwen/Qwen2.5-7B-Instruct      			   | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
| GLM   	 | THUDM/glm-4-9b-chat      				   | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
| Yi   	 	 | 01-ai/Yi-1.5-34B-Chat-16K     			   | 0.00126yuan/1,000 tokens          | 0.00126yuan/1,000 tokens         |
| Yi   	 	 | 01-ai/Yi-1.5-9B-Chat-16K      			   | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
| Gemma   	 | google/gemma-2-27b-it      				   | 0.00126yuan/1,000 tokens          | 0.00126yuan/1,000 tokens         |
| Gemma   	 | google/gemma-2-9b-it      				   | 0.00000yuan/1,000 tokens          | 0.00000yuan/1,000 tokens         |
`
}

func (p *SiliconFlowProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"deepseek-ai/DeepSeek-R1":                   {0.00400, 0.01600},
		"deepseek-ai/DeepSeek-V3":                   {0.00200, 0.00800},
		"deepseek-ai/DeepSeek-R1-Distill-Llama-70B": {0.00413, 0.00413},
		"deepseek-ai/DeepSeek-R1-Distill-Qwen-32B":  {0.00126, 0.00126},
		"deepseek-ai/DeepSeek-R1-Distill-Qwen-14B":  {0.00070, 0.00070},
		"deepseek-ai/DeepSeek-R1-Distill-Llama-8B":  {0.00000, 0.00000},
		"deepseek-ai/DeepSeek-R1-Distill-Qwen-7B":   {0.00000, 0.00000},
		"deepseek-ai/DeepSeek-V2.5":                 {0.00133, 0.00133},
		"meta-llama/Llama-3.3-70B-Instruct":         {0.00413, 0.00413},
		"meta-llama/Meta-Llama-3.1-405B-Instruct":   {0.02100, 0.02100},
		"meta-llama/Meta-Llama-3.1-70B-Instruct":    {0.00413, 0.00413},
		"meta-llama/Meta-Llama-3.1-8B-Instruct":     {0.00000, 0.00000},
		"Qwen/Qwen2.5-72B-Instruct":                 {0.00413, 0.00413},
		"Qwen/Qwen2.5-32B-Instruct":                 {0.00126, 0.00126},
		"Qwen/Qwen2.5-14B-Instruct":                 {0.00070, 0.00070},
		"Qwen/Qwen2.5-7B-Instruct":                  {0.00000, 0.00000},
		"THUDM/glm-4-9b-chat":                       {0.00000, 0.00000},
		"01-ai/Yi-1.5-34B-Chat-16K":                 {0.00126, 0.00126},
		"01-ai/Yi-1.5-9B-Chat-16K":                  {0.00000, 0.00000},
		"google/gemma-2-27b-it":                     {0.00126, 0.00126},
		"google/gemma-2-9b-it":                      {0.00000, 0.00000},
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

func (p *SiliconFlowProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	const BaseUrl = "https://api.siliconflow.cn/v1"
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, BaseUrl, p.subType, 0, 0, "USD")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
