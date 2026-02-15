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

type BaiduCloudModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewBaiduCloudModelProvider(subType string, apiKey string, temperature float32, topP float32) (*BaiduCloudModelProvider, error) {
	return &BaiduCloudModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *BaiduCloudModelProvider) GetPricing() string {
	return `URL:
https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Blfmc9dlf

| Model                                 | Input Price per 1K tokens (CNY)     | Output Price per 1K tokens (CNY)     |
|-------------------------------------  |-------------------------------------|--------------------------------------|
| ernie-4.0-8k                          | 0.03                                | 0.09                                 |
| ernie-4.0-8k-latest                   | 0.03                                | 0.09                                 |
| ernie-4.0-8k-preview                  | 0.03                                | 0.09                                 |
| ernie-4.0-turbo-8k                    | 0.02                                | 0.06                                 |
| ernie-4.0-turbo-128k                  | 0.02                                | 0.06                                 |
| ernie-4.0-turbo-8k-preview            | 0.02                                | 0.06                                 |
| ernie-4.0-turbo-8k-latest             | 0.02                                | 0.02                                 |
| ernie-3.5-8k                          | 0.0008                              | 0.002                                |
| ernie-3.5-128k                        | 0.0008                              | 0.002                                |
| ernie-3.5-8k-preview                  | 0.0008                              | 0.002                                |
| ernie-speed-8k                        | free                                | free                                 |
| ernie-speed-128k                      | free                                | free                                 |
| ernie-speed-pro-128k                  | 0.0003                              | 0.0006                               |
| ernie-lite-8k                         | free                                | free                                 |
| ernie-lite-pro-128k                   | 0.0002                              | 0.0004                               |
| ernie-tiny-8k                         | free                                | free                                 |
| ernie-character-8k                    | 0.0003                              | 0.008                                |
| ernie-character-fiction-8k            | 0.004                               | 0.008                                |
| ernie-novel-8k                        | 0.04                                | 0.12                                 |
| deepseek-v3                           | 0.0008                              | 0.0016                               |
| deepseek-r1                           | 0.002                               | 0.008                                |
| deepseek-r1-distill-qwen-1.5b         | Free until March 12th,2025          | Free until March 12th,2025           |
| deepseek-r1-distill-qwen-7b           | Free until March 12th,2025          | Free until March 12th,2025           |
| deepseek-r1-distill-qwen-14b          | 0.0006                              | 0.0024                               |
| deepseek-r1-distill-qwen-32b          | 0.0015                              | 0.006                                |
| deepseek-r1-distill-llama-8b          | Free until March 12th,2025          | Free until March 12th,2025           |
| deepseek-r1-distill-llama-70b         | 0.002                               | 0.008                                |
| deepseek-r1-distill-qianfan-llama-8b  | Free until March 12th,2025          | Free until March 12th,2025           |
| deepseek-r1-distill-qianfan-llama-70b | 0.002                               | 0.008                                |
`
}

func (p *BaiduCloudModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"ernie-4.0-8k":                          {0.03, 0.09},
		"ernie-4.0-8k-latest":                   {0.03, 0.09},
		"ernie-4.0-8k-preview":                  {0.03, 0.09},
		"ernie-4.0-turbo-8k":                    {0.02, 0.06},
		"ernie-4.0-turbo-128k":                  {0.02, 0.06},
		"ernie-4.0-turbo-8k-preview":            {0.02, 0.06},
		"ernie-4.0-turbo-8k-latest":             {0.02, 0.02},
		"ernie-3.5-8k":                          {0.0008, 0.002},
		"ernie-3.5-128k":                        {0.0008, 0.002},
		"ernie-3.5-8k-preview":                  {0.0008, 0.002},
		"ernie-speed-8k":                        {0, 0},
		"ernie-speed-128k":                      {0, 0},
		"ernie-speed-pro-128k":                  {0.0003, 0.0006},
		"ernie-lite-8k":                         {0, 0},
		"ernie-lite-pro-128k":                   {0.0002, 0.0004},
		"ernie-tiny-8k":                         {0, 0},
		"ernie-character-8k":                    {0.0003, 0.008},
		"ernie-character-fiction-8k":            {0.004, 0.008},
		"ernie-novel-8k":                        {0.04, 0.12},
		"deepseek-v3":                           {0.0008, 0.0016},
		"deepseek-r1":                           {0.002, 0.008},
		"deepseek-r1-distill-qwen-1.5b":         {0, 0},
		"deepseek-r1-distill-qwen-7b":           {0, 0},
		"deepseek-r1-distill-qwen-14b":          {0.0006, 0.0024},
		"deepseek-r1-distill-qwen-32b":          {0.0015, 0.006},
		"deepseek-r1-distill-llama-8b":          {0, 0},
		"deepseek-r1-distill-llama-70b":         {0.002, 0.008},
		"deepseek-r1-distill-qianfan-llama-8b":  {0, 0},
		"deepseek-r1-distill-qianfan-llama-70b": {0.002, 0.008},
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

func (p *BaiduCloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	const BaseUrl = "https://qianfan.baidubce.com/v2"
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
