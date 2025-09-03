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
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/baidubce/bce-qianfan-sdk/go/qianfan"
)

type BaiduCloudModelProvider struct {
	subType     string
	apiKey      string
	temperature float64
	topP        float64
}

func NewBaiduCloudModelProvider(subType string, apiKey string, temperature float32, topP float32) (*BaiduCloudModelProvider, error) {
	return &BaiduCloudModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: float64(temperature),
		topP:        float64(topP),
	}, nil
}

func (p *BaiduCloudModelProvider) GetPricing() string {
	return `URL:
https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Blfmc9dlf

| Model                          | Input Price per 1K tokens (CNY) | Output Price per 1K tokens (CNY) |
| ------------------------------ | ------------------------------- | -------------------------------- |
| ERNIE-4.5-Turbo-128K-Preview   | 0.0008                          | 0.0032                           |
| ERNIE-4.5-Turbo-128K           | 0.0008                          | 0.0032                           |
| ERNIE-4.5-Turbo-32K            | 0.0008                          | 0.0032                           |
| ERNIE-4.5-Turbo-Latest         | 0.0008                          | 0.0032                           |
| ERNIE-4.5-Turbo-VL-Preview     | 0.003                           | 0.009                            |
| ERNIE-4.5-Turbo-VL             | 0.003                           | 0.009                            |
| ERNIE-4.5-Turbo-VL-32K         | 0.003                           | 0.009                            |
| ERNIE-4.5-Turbo-VL-32K-Preview | 0.003                           | 0.009                            |
| ERNIE-4.5-Turbo-VL-Latest      | 0.003                           | 0.009                            |
| ERNIE-4.5-8K                   | 0.004                           | 0.016                            |
| ERNIE-4.5-VL-28B-A3B           | 0.001                           | 0.004                            |
| ERNIE-4.5-0.3B                 | 0.0001                          | 0.0004                           |
| ERNIE-4.5-21B-A3B              | 0.0005                          | 0.002                            |
| ERNIE-4.0-Turbo-8K             | 0.003                           | 0.009                            |
| ERNIE-4.0-Turbo-128K           | 0.003                           | 0.009                            |
| ERNIE-4.0-Turbo-8K-Preview     | 0.003                           | 0.009                            |
| ERNIE-4.0-8K                   | 0.004                           | 0.016                            |
| ERNIE-4.0-8K-Preview           | 0.004                           | 0.016                            |
| ERNIE-3.5-8K                   | 0.0008                          | 0.002                            |
| ERNIE-3.5-128K                 | 0.0008                          | 0.002                            |
| ERNIE-3.5-8K-Preview           | 0.0008                          | 0.002                            |
| DeepSeek-V3.1-250821           | 0.004                           | 0.012                            |
| DeepSeek-V3                    | 0.002                           | 0.008                            |
| Kimi-K2-Instruct               | 0.004                           | 0.016                            |
| ERNIE-Speed-Pro-128K           | 0.0003                          | 0.0006                           |
| ERNIE-Lite-Pro-128K            | 0.0002                          | 0.0004                           |
| ernie-speed-128k               | 0                               | 0                                |
| ernie-speed-8k                 | 0                               | 0                                |
| ernie-lite-8k                  | 0                               | 0                                |
| ernie-tiny-8k                  | 0                               | 0                                |
| ernie-char-8k                  | 0.0003                          | 0.0006                           |
| ernie-char-fiction-8k          | 0.0003                          | 0.0006                           |
| ernie-char-fiction-8k-preview  | 0.0003                          | 0.0006                           |
| ernie-novel-8k                 | 0.04                            | 0.12                             |

`
}

func (p *BaiduCloudModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"ERNIE-4.5-Turbo-128K-Preview":   {0.0008, 0.0032},
		"ERNIE-4.5-Turbo-128K":           {0.0008, 0.0032},
		"ERNIE-4.5-Turbo-32K":            {0.0008, 0.0032},
		"ERNIE-4.5-Turbo-Latest":         {0.0008, 0.0032},
		"ERNIE-4.5-Turbo-VL-Preview":     {0.003, 0.009},
		"ERNIE-4.5-Turbo-VL":             {0.003, 0.009},
		"ERNIE-4.5-Turbo-VL-32K":         {0.003, 0.009},
		"ERNIE-4.5-Turbo-VL-32K-Preview": {0.003, 0.009},
		"ERNIE-4.5-Turbo-VL-Latest":      {0.003, 0.009},
		"ERNIE-4.5-8K":                   {0.004, 0.016},
		"ERNIE-4.5-VL-28B-A3B":           {0.001, 0.004},
		"ERNIE-4.5-0.3B":                 {0.0001, 0.0004},
		"ERNIE-4.5-21B-A3B":              {0.0005, 0.002},
		"ERNIE-4.0-Turbo-8K":             {0.003, 0.009},
		"ERNIE-4.0-Turbo-128K":           {0.003, 0.009},
		"ERNIE-4.0-Turbo-8K-Preview":     {0.003, 0.009},
		"ERNIE-4.0-8K":                   {0.004, 0.016},
		"ERNIE-4.0-8K-Preview":           {0.004, 0.016},
		"ERNIE-3.5-8K":                   {0.0008, 0.002},
		"ERNIE-3.5-128K":                 {0.0008, 0.002},
		"ERNIE-3.5-8K-Preview":           {0.0008, 0.002},
		"DeepSeek-V3.1-250821":           {0.004, 0.012},
		"DeepSeek-V3":                    {0.002, 0.008},
		"Kimi-K2-Instruct":               {0.004, 0.016},
		"ERNIE-Speed-Pro-128K":           {0.0003, 0.0006},
		"ERNIE-Lite-Pro-128K":            {0.0002, 0.0004},
		"ernie-speed-128k":               {0, 0},
		"ernie-speed-8k":                 {0, 0},
		"ernie-lite-8k":                  {0, 0},
		"ernie-tiny-8k":                  {0, 0},
		"ernie-char-8k":                  {0.0003, 0.0006},
		"ernie-char-fiction-8k":          {0.0003, 0.0006},
		"ernie-char-fiction-8k-preview":  {0.0003, 0.0006},
		"ernie-novel-8k":                 {0.04, 0.12},
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

func (p *BaiduCloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	err := os.Setenv("QIANFAN_BEARER_TOKEN", p.apiKey)
	if err != nil {
		return nil, err
	}
	chat := qianfan.NewChatCompletionV2()
	messages := []qianfan.ChatCompletionV2Message{
		{
			Role:    "user",
			Content: question,
		},
	}

	flushData := func(data string) error {
		log.Print(data)
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	modelResult := &ModelResult{}
	tokenizer := qianfan.NewTokenizer()
	TokenizerModeLocal := qianfan.TokenizerMode("local")
	additionalArguments := make(map[string]interface{})

	promptTokenCount, err := tokenizer.CountTokens(messages[0].Content, TokenizerModeLocal, "", additionalArguments)
	if err != nil {
		return nil, err
	}
	modelResult.PromptTokenCount = promptTokenCount
	modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

	resp, err := chat.Stream(ctx, &qianfan.ChatCompletionV2Request{
		Model:       p.subType,
		Messages:    messages,
		Temperature: p.temperature,
		TopP:        p.topP,
		StreamOptions: &qianfan.StreamOptions{
			IncludeUsage: true,
		},
	})
	if err != nil {
		return nil, err
	}

	for !resp.IsEnd {
		r := qianfan.ChatCompletionV2Response{}
		err := resp.Recv(&r)
		if err != nil {
			return nil, err
		}

		if len(r.Choices) == 0 {
			continue
		}

		data := r.Choices[0].Delta.Content
		err = flushData(data)
		if err != nil {
			return nil, err
		}
		if r.Usage != nil {
			modelResult.PromptTokenCount += r.Usage.PromptTokens
			modelResult.ResponseTokenCount += r.Usage.CompletionTokens
			modelResult.TotalTokenCount += r.Usage.TotalTokens
		}
	}
	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
