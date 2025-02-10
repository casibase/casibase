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

	"github.com/volcengine/volcengine-go-sdk/service/arkruntime"
	"github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
	"github.com/volcengine/volcengine-go-sdk/volcengine"
)

type DoubaoModelProvider struct {
	subType     string
	endpointID  string
	apiKey      string
	temperature float32
	topP        float32
}

func NewDoubaoModelProvider(subType string, endpointID string, apiKey string, temperature float32, topP float32) (*DoubaoModelProvider, error) {
	return &DoubaoModelProvider{
		subType:     subType,
		endpointID:  endpointID,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *DoubaoModelProvider) GetPricing() string {
	return `URL:
https://www.volcengine.com/docs/82379/1099320

| Model            | Input Price per 1K characters  | Output Price per 1K characters  |
|------------------|--------------------------------|---------------------------------|
| Doubao-lite-4k   | 0.0003 yuan/1,000 tokens       | 0.0006 yuan/1,000 tokens        |
| Doubao-lite-32k  | 0.0003 yuan/1,000 tokens       | 0.0006 yuan/1,000 tokens        |
| Doubao-lite-128k | 0.0008 yuan/1,000 tokens       | 0.0010 yuan/1,000 tokens        |
| Doubao-pro-4k    | 0.0008 yuan/1,000 tokens       | 0.0020 yuan/1,000 tokens        |
| Doubao-pro-32k   | 0.0008 yuan/1,000 tokens       | 0.0020 yuan/1,000 tokens        |
| Doubao-pro-128k  | 0.0050 yuan/1,000 tokens       | 0.0090 yuan/1,000 tokens        |
`
}

func (p *DoubaoModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"Doubao-lite-4k":   {0.0003, 0.0006},
		"Doubao-lite-32k":  {0.0003, 0.0006},
		"Doubao-lite-128k": {0.0008, 0.0010},
		"Doubao-pro-4k":    {0.0008, 0.0020},
		"Doubao-pro-32k":   {0.0008, 0.0020},
		"Doubao-pro-128k":  {0.0050, 0.0090},
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

func (p *DoubaoModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}
	client := arkruntime.NewClientWithApiKey(p.apiKey)

	// set request params
	messages := []*model.ChatCompletionMessage{
		{
			Role: model.ChatMessageRoleUser,
			Content: &model.ChatCompletionMessageContent{
				StringValue: volcengine.String(question),
			},
		},
	}
	request := model.ChatCompletionRequest{
		Model:         p.endpointID,
		Messages:      messages,
		Temperature:   p.temperature,
		TopP:          p.topP,
		Stream:        true,
		StreamOptions: &model.StreamOptions{IncludeUsage: true},
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	stream, err := client.CreateChatCompletionStream(ctx, request)
	if err != nil {
		fmt.Printf("stream chat error: %v\n", err)
		return nil, err
	}
	defer stream.Close()
	modelResult := newModelResult(0, 0, 0)

	for {
		response, err := stream.Recv()

		if response.Usage != nil {
			modelResult.PromptTokenCount += response.Usage.PromptTokens
			modelResult.ResponseTokenCount += response.Usage.CompletionTokens
			modelResult.TotalTokenCount += response.Usage.TotalTokens
		}

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
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
