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

	"github.com/sashabaranov/go-openai"
)

type XaiModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewXaiModelProvider(subType string, apiKey string, temperature float32, topP float32) (*XaiModelProvider, error) {
	return &XaiModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *XaiModelProvider) GetPricing() string {
	return `URL:
https://docs.x.ai/docs/models

| Model                    | Context Size | Input Price per 1M tokens | Image Input Price | Output Price per 1M tokens | Special Features |
|-------------------------|--------------|---------------------------|-------------------|---------------------------|------------------|
| grok-3                  | 131,072      | $3.00                     | not supported     | $15.00                    | Text only        |
| grok-3-fast             | 131,072      | $5.00                     | not supported     | $25.00                    | Text only        |
| grok-3-mini             | 131,072      | $0.30                     | not supported     | $0.50                     | Text only        |
| grok-3-mini-fast        | 131,072      | $0.60                     | not supported     | $4.00                     | Text only        |
| grok-2-vision-1212      | 32,768       | $2.00                     | $2.00             | $10.00                    | Vision support   |
| grok-2-image-1212       | 131,072      | not supported             | not supported     | not supported             | $0.07 per image  |
| grok-2-1212             | 131,072      | $2.00                     | not supported     | $10.00                    | Text only        |
`
}

func (p *XaiModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"grok-3":             {3.00, 15.00},
		"grok-3-fast":        {5.00, 25.00},
		"grok-3-mini":        {0.30, 0.50},
		"grok-3-mini-fast":   {0.60, 4.00},
		"grok-2-vision-1212": {2.00, 10.00},
		"grok-2-1212":        {2.00, 10.00},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice

		if p.subType == "grok-2-vision-1212" && modelResult.ImageCount > 0 {
			price += float64(modelResult.ImageCount) * 2.00
		}
	} else if p.subType == "grok-2-image-1212" {
		price = float64(modelResult.ImageCount) * 0.07
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "USD"
	return nil
}

func (p *XaiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	const BaseUrl = "https://api.x.ai/v1"
	config := openai.DefaultConfig(p.apiKey)
	config.BaseURL = BaseUrl
	client := openai.NewClientWithConfig(config)

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
		StreamOptions: &openai.StreamOptions{
			IncludeUsage: true,
		},
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	modelResult := &ModelResult{}

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

		if response.Usage != nil {
			modelResult.PromptTokenCount = response.Usage.PromptTokens
			modelResult.ResponseTokenCount = response.Usage.CompletionTokens
			modelResult.TotalTokenCount = response.Usage.TotalTokens
		}

		if len(response.Choices) == 0 {
			continue
		}
		data := response.Choices[0].Delta.Content
		err = flushData(data)
		if err != nil {
			return nil, err
		}

	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
