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

	"github.com/sashabaranov/go-openai"
)

type BaichuanModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewBaichuanModelProvider(subType string, apiKey string, temperature float32, topP float32) (*BaichuanModelProvider, error) {
	return &BaichuanModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *BaichuanModelProvider) GetPricing() string {
	return `URL:
https://platform.baichuan-ai.com/price

| Model      | sub-type             | Input Price per 1K characters    | Output Price per 1K characters |
|------------|----------------------|----------------------------------|--------------------------------|
| Baichuan   | Baichuan2-Turbo      | 0.008yuan/1,000 tokens           | 0.008yuan/1,000 tokens         |
| Baichuan   | Baichuan3-Turbo      | 0.012yuan/1,000 tokens           | 0.012yuan/1,000 tokens         |
| Baichuan   | Baichuan4            | 0.100yuan/1,000 tokens           | 0.100yuan/1,000 tokens         |
`
}

func (p *BaichuanModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"Baichuan2-Turbo": {0.008, 0.008},
		"Baichuan3-Turbo": {0.012, 0.012},
		"Baichuan4":       {0.1, 0.1},
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

func (p *BaichuanModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	const BaseUrl = "https://api.baichuan-ai.com/v1"
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

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
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

		data := response.Choices[0].Delta.Content
		err = flushData(data)
		if err != nil {
			return nil, err
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
