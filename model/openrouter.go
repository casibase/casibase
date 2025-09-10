// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

	"github.com/casibase/casibase/proxy"
	"github.com/casibase/go-openrouter"
)

type OpenRouterModelProvider struct {
	subType     string
	secretKey   string
	siteName    string
	siteUrl     string
	temperature *float32
	topP        *float32
}

func NewOpenRouterModelProvider(subType string, secretKey string, temperature float32, topP float32) (*OpenRouterModelProvider, error) {
	p := &OpenRouterModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		siteName:    "Casibase",
		siteUrl:     "https://casibase.org",
		temperature: &temperature,
		topP:        &topP,
	}
	return p, nil
}

func (p *OpenRouterModelProvider) GetPricing() string {
	return `URL:
https://openrouter.ai/docs#models

| Model Name                                 | Prompt cost ($ per 1K tokens) | Completion cost ($ per 1K tokens) | Context (tokens) |
| ------------------------------------------ | ----------------------------- | --------------------------------- | ---------------- |
| openai/gpt-5-chat                          | $0.00125                      | $0.01                             | 128000           |
| openai/gpt-5                               | $0.00125                      | $0.01                             | 400000           |
| openai/gpt-5-mini                          | $0.00025                      | $0.002                            | 400000           |
| openai/gpt-5-nano                          | $0.00005                      | $0.0004                           | 400000           |
| openai/o3-pro                              | $0.02                         | $0.08                             | 200000           |
| openai/o3                                  | $0.002                        | $0.008                            | 200000           |
| openai/o4-mini                             | $0.0011                       | $0.0044                           | 200000           |
| openai/chatgpt-4o-latest                   | $0.005                        | $0.015                            | 128000           |
| anthropic/claude-opus-4.1                  | $0.015                        | $0.075                            | 200000           |
| anthropic/claude-opus-4                    | $0.015                        | $0.075                            | 200000           |
| anthropic/claude-sonnet-4                  | $0.003                        | $0.015                            | 1000000          |
| anthropic/claude-3.7-sonnet                | $0.003                        | $0.015                            | 200000           |
| google/gemini-2.5-flash-lite               | $0.0003                       | $0.0004                           | 32768            |
| google/gemini-2.5-flash-lite-preview-06-17 | $0.0001                       | $0.0004                           | 1048576          |
| google/gemini-2.5-flash                    | $0.0001                       | $0.0025                           | 1048576          |
| google/gemini-2.5-pro                      | $0.0003                       | $0.01                             | 1048576          |
| google/gemini-2.5-pro-preview              | $0.00125                      | $0.01                             | 1048576          |
| google/gemini-2.5-pro-preview-05-06        | $0.00125                      | $0.01                             | 1048576          |
`
}

func (p *OpenRouterModelProvider) calculatePrice(modelResult *ModelResult) error {
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64
	priceTable := map[string][]float64{
		"openai/gpt-5-chat":                          {0.00125, 0.01},
		"openai/gpt-5":                               {0.00125, 0.01},
		"openai/gpt-5-mini":                          {0.00025, 0.002},
		"openai/gpt-5-nano":                          {0.00005, 0.0004},
		"openai/o3-pro":                              {0.02, 0.08},
		"openai/o3":                                  {0.002, 0.008},
		"openai/o4-mini":                             {0.0011, 0.0044},
		"openai/chatgpt-4o-latest":                   {0.005, 0.015},
		"anthropic/claude-opus-4.1":                  {0.015, 0.075},
		"anthropic/claude-opus-4":                    {0.015, 0.075},
		"anthropic/claude-sonnet-4":                  {0.003, 0.015},
		"anthropic/claude-3.7-sonnet":                {0.003, 0.015},
		"google/gemini-2.5-flash-lite":               {0.0003, 0.0004},
		"google/gemini-2.5-flash-lite-preview-06-17": {0.0001, 0.0004},
		"google/gemini-2.5-flash":                    {0.0001, 0.0025},
		"google/gemini-2.5-pro":                      {0.0003, 0.01},
		"google/gemini-2.5-pro-preview":              {0.00125, 0.01},
		"google/gemini-2.5-pro-preview-05-06":        {0.00125, 0.01},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPricePerThousandTokens = priceItem[0]
		outputPricePerThousandTokens = priceItem[1]
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	modelResult.Currency = "USD"
	return nil
}

func (p *OpenRouterModelProvider) getProxyClientFromToken() *openrouter.Client {
	config, err := openrouter.DefaultConfig(p.secretKey, p.siteName, p.siteUrl)
	if err != nil {
		panic(err)
	}

	config.HTTPClient = proxy.ProxyHttpClient

	c := openrouter.NewClientWithConfig(config)
	return c
}

func (p *OpenRouterModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	client := p.getProxyClientFromToken()

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	model := p.subType
	if model == "" {
		model = openrouter.Gpt35Turbo
	}

	tokenCount, err := GetTokenSize(model, question)
	if err != nil {
		return nil, err
	}

	contextLength := getContextLength(p.subType)

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(model, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if contextLength > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	maxTokens := contextLength - tokenCount
	if maxTokens < 0 {
		return nil, fmt.Errorf("The token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", tokenCount, model, contextLength)
	}

	temperature := p.temperature
	topP := p.topP

	respStream, err := client.CreateChatCompletionStream(
		ctx,
		&openrouter.ChatCompletionRequest{
			Model: p.subType,
			Messages: []openrouter.ChatCompletionMessage{
				{
					Role:    openrouter.ChatMessageRoleSystem,
					Content: "You are a helpful assistant.",
				},
				{
					Role:    openrouter.ChatMessageRoleUser,
					Content: question,
				},
			},
			Stream:      false,
			Temperature: temperature,
			TopP:        topP,
			MaxTokens:   maxTokens,
		},
	)
	if err != nil {
		return nil, err
	}
	defer respStream.Close()

	responseStringBuilder := strings.Builder{}

	isLeadingReturn := true
	for {
		completion, streamErr := respStream.Recv()
		if streamErr != nil {
			if streamErr == io.EOF {
				break
			}
			return nil, streamErr
		}

		data := completion.Choices[0].Message.Content
		if isLeadingReturn && len(data) != 0 {
			if strings.Count(data, "\n") == len(data) {
				continue
			} else {
				isLeadingReturn = false
			}
		}

		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return nil, err
		}

		// save the response for token count
		_, _ = responseStringBuilder.WriteString(data)

		flusher.Flush()
	}

	modelResult, err := getDefaultModelResult(p.subType, question, responseStringBuilder.String())
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
