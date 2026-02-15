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
	"regexp"

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/i18n"
	"github.com/volcengine/volcengine-go-sdk/service/arkruntime"
	"github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
	"github.com/volcengine/volcengine-go-sdk/volcengine"
)

type VolcengineModelProvider struct {
	subType     string
	endpointID  string
	apiKey      string
	temperature float32
	topP        float32
}

func NewVolcengineModelProvider(subType string, endpointID string, apiKey string, temperature float32, topP float32) (*VolcengineModelProvider, error) {
	return &VolcengineModelProvider{
		subType:     subType,
		endpointID:  endpointID,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func trimModelDate(subType string) string {
	// change "doubao-seed-1-6-250615" to "doubao-seed-1-6"
	re := regexp.MustCompile(`-\d{6}$`)
	return re.ReplaceAllString(subType, "")
}

func (p *VolcengineModelProvider) GetPricing() string {
	return `URL:
https://www.volcengine.com/docs/82379/1099320

| Model                          | Input Price per 1K tokens (yuan) | Output Price per 1K tokens (yuan) |
|--------------------------------|----------------------------------|-----------------------------------|
| doubao-seed-1.6-vision         | 0.0008                          | 0.0080                           |
| doubao-seed-1-6                | 0.0008                          | 0.0020                           |
| doubao-seed-1-6-thinking       | 0.0008                          | 0.0080                           |
| doubao-seed-1-6-flash          | 0.0002                          | 0.0015                           |
| doubao-1-5-thinking-pro        | 0.0040                          | 0.0160                           |
| doubao-1-5-thinking-vision-pro | 0.0030                          | 0.0090                           |
| deepseek-v3.1                  | 0.0040                          | 0.0120                           |
| deepseek-v3.2                  | 0.0040                          | 0.0120                           |
| deepseek-r1                    | 0.0040                          | 0.0160                           |
| deepseek-r1-distill-qwen-32b   | 0.0015                          | 0.0060                           |
| deepseek-r1-distill-qwen-7b    | 0.0006                          | 0.0024                           |
| doubao-1-5-pro-32k             | 0.0008                          | 0.0020                           |
| doubao-1-5-pro-256k            | 0.0050                          | 0.0090                           |
| doubao-1-5-lite-32k            | 0.0003                          | 0.0006                           |
| doubao-pro-32k                 | 0.0008                          | 0.0020                           |
| doubao-pro-256k                | 0.0050                          | 0.0090                           |
| doubao-lite-4k                 | 0.0003                          | 0.0006                           |
| doubao-lite-32k                | 0.0003                          | 0.0006                           |
| doubao-lite-128k               | 0.0008                          | 0.0010                           |
| kimi-k2                        | 0.0040                          | 0.0120                           |
| deepseek-v3                    | 0.0020                          | 0.0080                           |
| doubao-1-5-vision-pro          | 0.0030                          | 0.0090                           |
| doubao-1-5-vision-lite         | 0.0015                          | 0.0045                           |
| doubao-1-5-ui-tars             | 0.0035                          | 0.0120                           |
| doubao-1-5-vision-pro-32k      | 0.0030                          | 0.0090                           |
| doubao-vision-pro-32k          | 0.0030                          | 0.0090                           |
| doubao-vision-lite-32k         | 0.0015                          | 0.0045                           |
| doubao-embedding               | 0.0005                          | 0.0000                           |
| doubao-embedding-large         | 0.0007                          | 0.0000                           |
| doubao-embedding-vision        | 0.0007                          | 0.0000                           |
| doubao-seedance-1-0-pro        | 0.0150                          | 0.0000                           |
| doubao-seedance-1-0-lite-t2v   | 0.0100                          | 0.0000                           |
| doubao-seaweed                 | 0.0300                          | 0.0000                           |
| wan2-1-14b                     | 0.0500                          | 0.0000                           |
| doubao-seedream-4.0            | 0.2000                          | 0.0000                           |
| doubao-seedream-3-0-t2i        | 0.2590                          | 0.0000                           |
| doubao-seededit-3.0-i2i        | 0.3000                          | 0.0000                           |
| doubao-realtime                | 0.0300                          | 0.0300                           |
`
}

func (p *VolcengineModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		// Deep thinking models
		"doubao-seed-1.6-vision":         {0.0008, 0.0080},  // Base pricing for input [0,32]
		"doubao-seed-1-6":                {0.0008, 0.0020},  // Base pricing for input [0,32], output [0,0.2]
		"doubao-seed-1-6-thinking":       {0.0008, 0.0080},  // Base pricing for input [0,32]
		"doubao-seed-1-6-flash":          {0.00015, 0.0015}, // Base pricing for input [0,32]
		"doubao-1-5-thinking-pro":        {0.0040, 0.0160},
		"doubao-1-5-thinking-vision-pro": {0.0030, 0.0090},
		"deepseek-v3.1":                  {0.0040, 0.0120},
		"deepseek-v3.2":                  {0.0040, 0.0120},
		"deepseek-r1":                    {0.0040, 0.0160},
		"deepseek-r1-distill-qwen-32b":   {0.0015, 0.0060},
		"deepseek-r1-distill-qwen-7b":    {0.0006, 0.0024},
		// Large language models
		"doubao-1-5-pro-32k":  {0.0008, 0.0020},
		"doubao-1-5-pro-256k": {0.0050, 0.0090},
		"doubao-1-5-lite-32k": {0.0003, 0.0006},
		"doubao-pro-32k":      {0.0008, 0.0020},
		"doubao-pro-256k":     {0.0050, 0.0090},
		"doubao-lite-4k":      {0.0003, 0.0006},
		"doubao-lite-32k":     {0.0003, 0.0006},
		"doubao-lite-128k":    {0.0008, 0.0010},
		"kimi-k2":             {0.0040, 0.0120},
		"deepseek-v3":         {0.0020, 0.0080},
		// Vision understanding models
		"doubao-1-5-vision-pro":     {0.0030, 0.0090},
		"doubao-1-5-vision-lite":    {0.0015, 0.0045},
		"doubao-1-5-ui-tars":        {0.0035, 0.0120},
		"doubao-1-5-vision-pro-32k": {0.0030, 0.0090},
		"doubao-vision-pro-32k":     {0.0030, 0.0090},
		"doubao-vision-lite-32k":    {0.0015, 0.0045},
		// Text embedding models
		"doubao-embedding":       {0.0005, 0.0},
		"doubao-embedding-large": {0.0007, 0.0},
		// Image-text embedding models
		"doubao-embedding-vision": {0.0007, 0.0},
		// Video generation models
		"doubao-seedance-1-0-pro":      {0.015, 0.0},
		"doubao-seedance-1-0-lite-t2v": {0.010, 0.0},
		"doubao-seaweed":               {0.030, 0.0},
		"wan2-1-14b":                   {0.050, 0.0},
		// Simultaneous interpretation model
		"doubao-realtime": {0.0300, 0.0300},
	}

	subType := trimModelDate(p.subType)

	// Special handling for image generation models
	switch subType {
	case "doubao-seedream-4.0":
		modelResult.TotalPrice = float64(modelResult.ImageCount) * 0.2
		modelResult.Currency = "CNY"
		return nil
	case "doubao-seedream-3-0-t2i":
		modelResult.TotalPrice = float64(modelResult.ImageCount) * 0.259
		modelResult.Currency = "CNY"
		return nil
	case "doubao-seededit-3.0-i2i":
		modelResult.TotalPrice = float64(modelResult.ImageCount) * 0.3
		modelResult.Currency = "CNY"
		return nil
	}

	if priceItem, ok := priceTable[subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *VolcengineModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
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
		Model:         p.subType,
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
		logs.Error("stream chat error: %v", err)
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

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
