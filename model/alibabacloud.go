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
	"context"
	"fmt"
	"io"
	"net/http"

	dashscopego "github.com/casibase/dashscope-go-sdk"
	"github.com/casibase/dashscope-go-sdk/qwen"
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

| Model               | sub-type                        | Input Price per 1K characters    | Output Price per 1K characters |
|---------------------|---------------------------------|----------------------------------|--------------------------------|
| Qwen-Long           | qwen-long                       | 0.0005yuan/1,000 tokens          | 0.002yuan/1,000 tokens         |
| Qwen-Turbo          | qwen-turbo                      | 0.002yuan/1,000 tokens           | 0.006yuan/1,000 tokens         |
| Qwen-Plus           | qwen-plus                       | 0.004yuan/1,000 tokens           | 0.012yuan/1,000 tokens         |
| Qwen-Max            | qwen-max                        | 0.04yuan/1,000 tokens            | 0.12yuan/1,000 tokens          |
| Qwen-Max            | qwen-max-longcontext            | 0.04yuan/1,000 tokens            | 0.12yuan/1,000 tokens          |
| Qwen3-235B-a22B     | qwen3-235b-a22b                 | 0.004yuan/1,000 tokens            | 0.04yuan/1,000 tokens         |
| Qwen3-32B           | qwen3-32b            			| 0.002yuan/1,000 tokens            | 0.02yuan/1,000 tokens         |
| DeepSeek-R1         | deepseek-r1                     | 0.002yuan/1,000 tokens           | 0.008yuan/1,000 tokens         |
| DeepSeek-V3         | deepseek-v3                     | 0.001yuan/1,000 tokens           | 0.004yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-1.5b   | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-7b     | 0.0005yuan/1,000 tokens          | 0.001yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-14b    | 0.001yuan/1,000 tokens           | 0.003yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-32b    | 0.002yuan/1,000 tokens           | 0.006yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-llama-8b    | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-llama-70b   | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
`
}

func (p *AlibabacloudModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"qwen-long":                     {0.0005, 0.002},
		"qwen-turbo":                    {0.002, 0.006},
		"qwen-plus":                     {0.004, 0.012},
		"qwen-max":                      {0.040, 0.120},
		"qwen-max-longcontext":          {0.040, 0.120},
		"qwen3-235b-a22b":               {0.004, 0.04},
		"qwen3-32b":                     {0.002, 0.02},
		"deepseek-r1":                   {0.002, 0.008},
		"deepseek-v3":                   {0.001, 0.004},
		"deepseek-r1-distill-qwen-1.5b": {0.000, 0.000},
		"deepseek-r1-distill-qwen-7b":   {0.001, 0.003},
		"deepseek-r1-distill-qwen-14b ": {0.002, 0.006},
		"deepseek-r1-distill-qwen-32b":  {0.000, 0.000},
		"deepseek-r1-distill-llama-8b":  {0.000, 0.000},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "model:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *AlibabacloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	// Create Alibaba Cloud client using official SDK
	cli := dashscopego.NewTongyiClient(p.subType, p.apiKey)

	// Prepare messages from history, prompt, and knowledge
	maxTokens := getContextLength(p.subType)
	rawMessages, err := OpenaiGenerateMessages(prompt, question, history, knowledgeMessages, p.subType, maxTokens, lang)
	if err != nil {
		return nil, err
	}
	if agentInfo != nil && agentInfo.AgentMessages != nil && agentInfo.AgentMessages.Messages != nil {
		rawMessages = append(rawMessages, agentInfo.AgentMessages.Messages...)
	}

	// Convert messages to Alibaba Cloud format
	var messages []qwen.Message[*qwen.TextContent]
	for _, rawMsg := range rawMessages {
		content := &qwen.TextContent{Text: rawMsg.Text}
		messages = append(messages, qwen.Message[*qwen.TextContent]{
			Role:    rawMsg.Author,
			Content: content,
		})
	}

	// Set up parameters with web_search support
	params := qwen.DefaultParameters().
		SetTemperature(float64(p.temperature)).
		SetTopP(float64(p.topP)).
		SetIncrementalOutput(true)

	// Enable web search if requested
	if agentInfo != nil && agentInfo.AgentClients != nil && agentInfo.AgentClients.WebSearchEnabled {
		params.SetEnableSearch(true)
	}

	// Create streaming callback function
	streamCallbackFn := func(ctx context.Context, chunk []byte) error {
		err := flushDataThink(string(chunk), "message", writer, lang)
		if err != nil {
			return err
		}
		return nil
	}

	// Build request
	req := &qwen.Request[*qwen.TextContent]{
		Model: p.subType,
		Input: qwen.Input[*qwen.TextContent]{
			Messages: messages,
		},
		Parameters:  params,
		StreamingFn: streamCallbackFn,
	}

	// Execute streaming request
	resp, err := cli.CreateCompletion(ctx, req)
	if err != nil {
		return nil, err
	}

	// Calculate tokens and price
	modelResult := &ModelResult{
		PromptTokenCount:   resp.Usage.InputTokens,
		ResponseTokenCount: resp.Usage.OutputTokens,
		TotalTokenCount:    resp.Usage.TotalTokens,
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	flusher.Flush()
	return modelResult, nil
}
