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
	"net/http"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type YiProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewYiProvider(subType string, apiKey string, temperature float32, topP float32) (*YiProvider, error) {
	return &YiProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *YiProvider) GetPricing() string {
	return `URL:
https://platform.lingyiwanwu.com
    
| Model          | Context Window | Input Price (per 1M tokens) | Output Price (per 1M tokens) |
|----------------|---------------|---------------------------|----------------------------|
| yi-lightning   | 16K          | ¥0.99                    | ¥0.99                     |
| yi-vision-v2   | 16K          | ¥6.00                    | ¥6.00                     |`
}

func (p *YiProvider) calculatePrice(modelResult *ModelResult) error {
	// Price table (price per 1000 tokens in CNY)
	priceTable := map[string][2]float64{
		"yi-lightning": {0.00099, 0.00099},
		"yi-vision-v2": {0.006, 0.006},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		modelResult.TotalPrice = inputPrice + outputPrice
		modelResult.Currency = "CNY"
		return nil
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}
}

func (p *YiProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	// Set up context and output stream
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	// Configure Yi API client
	const BaseUrl = "https://api.lingyiwanwu.com/v1"
	config := openai.DefaultConfig(p.apiKey)
	config.BaseURL = BaseUrl
	client := openai.NewClientWithConfig(config)

	// Build request messages
	messages := []openai.ChatCompletionMessage{
		{
			Role:    "user",
			Content: question,
		},
	}

	// Create chat request
	request := openai.ChatCompletionRequest{
		Model:       p.subType,
		Messages:    messages,
		Temperature: p.temperature,
		TopP:        p.topP,
		Stream:      true,
	}

	// Calculate token count
	modelResult := &ModelResult{}
	promptTokenCount, err := OpenaiNumTokensFromMessages(messages, "gpt-4")
	if err != nil {
		return nil, err
	}
	modelResult.PromptTokenCount = promptTokenCount
	modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

	// Handle dry run
	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		if GetOpenAiMaxTokens(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	// Create stream response
	stream, err := client.CreateChatCompletionStream(ctx, request)
	if err != nil {
		return nil, err
	}
	defer stream.Close()

	// Process stream response
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

		// Send data to client
		data := response.Choices[0].Delta.Content
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return nil, err
		}
		flusher.Flush()

		// Update token count and price
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
