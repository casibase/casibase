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
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/madebywelch/anthropic-go/v2/pkg/anthropic"
	"github.com/madebywelch/anthropic-go/v2/pkg/anthropic/utils"
)

type ClaudeModelProvider struct {
	subType   string
	secretKey string
}

func NewClaudeModelProvider(subType string, secretKey string) (*ClaudeModelProvider, error) {
	return &ClaudeModelProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *ClaudeModelProvider) GetPricing() string {
	return `URL:
https://docs.anthropic.com/claude/docs/models-overview#model-comparison

| Model family   | Context window | Input Pricing         | Output Pricing        |
|----------------|----------------|-----------------------|-----------------------|
| Claude Instant | 100,000 tokens | $0.80/million tokens  | $2.40/million tokens  |
| Claude 2.0     | 100,000 tokens | $8.00/million tokens  | $24.00/million tokens |
| Claude 2.1     | 200,000 tokens | $8.00/million tokens  | $24.00/million tokens |
| Claude Haiku   | 200,000 tokens | $0.25/million tokens  | $1.25/million tokens  |
| Claude Sonnet  | 200,000 tokens | $3.00/million tokens  | $15.00/million tokens |
| Claude Opus    | 200,000 tokens | $15.00/million tokens | $75.00/million tokens |
`
}

func GetClaudeMaxTokens(model string) int {
	if model == "Claude 2.0" || model == "Claude Instant" {
		return 100000
	}
	return 200000
}

func (p *ClaudeModelProvider) calculatePrice(modelResult *ModelResult) error {
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64
	priceTable := map[string][]float64{
		"claude-instant-1.2":         {0.0008, 0.0024},
		"claude-2.0":                 {0.008, 0.024},
		"claude-2.1":                 {0.008, 0.024},
		"claude-3-sonnet-20240229":   {0.003, 0.015},
		"claude-3-opus-20240229":     {0.015, 0.075},
		"claude-3-7-sonnet-20250219": {0.003, 0.015},
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

func (p *ClaudeModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client, err := anthropic.NewClient(p.secretKey)
	if err != nil {
		return nil, err
	}

	question, err = utils.GetPrompt(question)
	if err != nil {
		return nil, err
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if GetClaudeMaxTokens(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	request := anthropic.NewCompletionRequest(
		question,
		anthropic.WithModel[anthropic.CompletionRequest](anthropic.Model(p.subType)),
		anthropic.WithMaxTokens[anthropic.CompletionRequest](1024),
		anthropic.WithStopSequences[anthropic.CompletionRequest]([]string{"\r", "Human:"}),
	)

	response, err := client.Complete(request)
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	flushData := func(data string) error {
		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	err = flushData(response.Completion)
	if err != nil {
		return nil, err
	}

	modelResult, err := getDefaultModelResult(p.subType, question, response.Completion)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
