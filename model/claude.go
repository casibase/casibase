// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"fmt"
	"io"
	"net/http"

	"github.com/madebywelch/anthropic-go/pkg/anthropic"
)

type ClaudeModelProvider struct {
	subType   string
	secretKey string
}

func NewClaudeModelProvider(subType string, secretKey string) (*ClaudeModelProvider, error) {
	return &ClaudeModelProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *ClaudeModelProvider) GetPricing() (string, string) {
	return "Free", `URL:
https://www.anthropic.com/pricing

| Model family   | Best for                                                                              | Context window | Standard Pricing     | Instant Pricing       |
|----------------|---------------------------------------------------------------------------------------|----------------|----------------------|-----------------------|
| Claude Instant | Low latency, high throughput use cases                                                | 100,000 tokens | $0.80/million tokens | $2.40/million tokens  |
| Claude 2.0     | Tasks that require complex reasoning                                                  | 100,000 tokens | $8.00/million tokens | $24.00/million tokens |
| Claude 2.1     | Same performance as Claude 2, plus significant reduction in model hallucination rates | 200,000 tokens | $8.00/million tokens | $24.00/million tokens |
`
}

func (p *ClaudeModelProvider) calculatePrice(mr *ModelResult) {
	priceTable := map[string][]float64{
		"claude-2": {0.80, 2.40},
	}
	if price, ok := priceTable[p.subType]; ok {
		mr.TotalPrice = price[0]*float64(mr.PromptTokenCount) + price[1]*float64(mr.ResponseTokenCount)
	} else {
		// model not found
		mr.TotalPrice = 0.0
	}
}

func (p *ClaudeModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client, err := anthropic.NewClient(p.secretKey)
	if err != nil {
		panic(err)
	}
	response, _ := client.Complete(&anthropic.CompletionRequest{
		Prompt:            anthropic.GetPrompt(question),
		Model:             anthropic.Model(p.subType),
		MaxTokensToSample: 100,
		StopSequences:     []string{"\r", "Human:"},
	}, nil)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	err = flushData(response.Completion)
	if err != nil {
		return nil, err
	}

	// get token count and price
	mr := new(ModelResult)
	promptTokenCount, err := GetTokenSize(p.subType, question)
	if err != nil {
		return nil, err
	}
	mr.PromptTokenCount = promptTokenCount
	responseTokenCount, err := GetTokenSize(p.subType, response.Completion)
	if err != nil {
		return nil, err
	}
	mr.ResponseTokenCount = responseTokenCount
	mr.TotalTokenCount = promptTokenCount + responseTokenCount
	p.calculatePrice(mr)

	return mr, nil
}
