// Copyright 2024 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
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

type StepFunModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewStepFunModelProvider(subType string, apiKey string, temperature float32, topP float32) (*StepFunModelProvider, error) {
	return &StepFunModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *StepFunModelProvider) GetPricing() string {
	return `URL:
https://platform.stepfun.com/docs/pricing/details

| Model        | Input Price per 1K characters    | Output Price per 1K characters |
|--------------|----------------------------------|--------------------------------|
| step-1-8k    | 0.005yuan/1,000 tokens           | 0.02yuan/1,000 tokens          |
| step-1-32k   | 0.015yuan/1,000 tokens           | 0.07yuan/1,000 tokens          |
| step-1-128k  | 0.04yuan/1,000 tokens            | 0.2yuan/1,000 tokens           |
| step-1-256k  | 0.095yuan/1,000 tokens           | 0.3yuan/1,000 tokens           |
| step-1-flash | 0.001yuan/1,000 tokens           | 0.004yuan/1,000 tokens         |
| step-2-16k   | 0.038yuan/1,000 tokens           | 0.12yuan/1,000 tokens          |
`
}

func (p *StepFunModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"step-1-8k":    {0.005, 0.02},
		"step-1-32k":   {0.015, 0.07},
		"step-1-128k":  {0.04, 0.2},
		"step-1-256k":  {0.095, 0.3},
		"step-1-flash": {0.001, 0.004},
		"step-2-16k":   {0.038, 0.12},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *StepFunModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	const BaseUrl = "https://api.stepfun.com/v1"
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

		modelResult.PromptTokenCount = response.Usage.PromptTokens
		modelResult.ResponseTokenCount = response.Usage.CompletionTokens
		modelResult.TotalTokenCount = response.Usage.TotalTokens
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
