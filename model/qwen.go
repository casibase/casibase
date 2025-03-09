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
	"strings"

	"github.com/sashabaranov/go-openai"
)

type QwenModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewQwenModelProvider(subType string, apiKey string, temperature float32, topP float32) (*QwenModelProvider, error) {
	return &QwenModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *QwenModelProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/getting-started/models

| Model      | sub-type             | Input Price per 1K characters    | Output Price per 1K characters |
|------------|----------------------|----------------------------------|--------------------------------|
| Qwen-Long  | qwen-long            | 0.0005yuan/1,000 tokens          | 0.002yuan/1,000 tokens         |
| Qwen-Turbo | qwen-turbo           | 0.0003yuan/1,000 tokens          | 0.0006yuan/1,000 tokens        |
| Qwen-Plus  | qwen-plus            | 0.0008yuan/1,000 tokens          | 0.002yuan/1,000 tokens         |
| Qwen-Max   | qwen-max             | 0.0024yuan/1,000 tokens          | 0.0096yuan/1,000 tokens        |
`
}

func (p *QwenModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"qwen-long":  {0.0005, 0.002},
		"qwen-turbo": {0.0003, 0.0006},
		"qwen-plus":  {0.0008, 0.002},
		"qwen-max":   {0.0024, 0.0096},
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

func (p *QwenModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	const BaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	config := openai.DefaultConfig(p.apiKey)
	config.BaseURL = BaseUrl
	client := openai.NewClientWithConfig(config)

	// set request params
	messages := []openai.ChatCompletionMessage{
		{
			Role:    "user",
			Content: question,
		},
	}

	request := openai.ChatCompletionRequest{
		Model:       p.subType,
		Messages:    messages,
		Temperature: p.temperature,
		TopP:        p.topP,
		Stream:      true,
	}

	flushData := func(data string, eventType string) error {
		if _, err := fmt.Fprintf(writer, "event: %s\ndata: %s\n\n", eventType, data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	modelResult := &ModelResult{}

	promptTokenCount, err := OpenaiNumTokensFromMessages(messages, "gpt-4") // calculate token
	if err != nil {
		return nil, err
	}
	modelResult.PromptTokenCount = promptTokenCount
	modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		if GetOpenAiMaxTokens(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	stream, err := client.CreateChatCompletionStream(ctx, request)
	if err != nil {
		return nil, err
	}
	defer stream.Close()
	for {
		response, err := stream.Recv()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}

		if len(response.Choices) == 0 {
			continue
		}

		var data string

		if response.Choices[0].Delta.ReasoningContent != "" {
			data = response.Choices[0].Delta.ReasoningContent
			err = flushData(data, "reason")
			if err != nil {
				return nil, err
			}
		}

		// Check if we have regular content
		if response.Choices[0].Delta.Content != "" {
			data = response.Choices[0].Delta.Content
			err = flushData(data, "message")
			if err != nil {
				return nil, err
			}
		}

		responseTokenCount, err := GetTokenSize("gpt-4", data)
		if err != nil {
			return nil, err
		}
		modelResult.ResponseTokenCount += responseTokenCount
		modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

		err = p.calculatePrice(modelResult)
		if err != nil {
			return nil, err
		}
	}
	return modelResult, nil
}
