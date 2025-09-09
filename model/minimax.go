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

	textv1 "github.com/ConnectAI-E/go-minimax/gen/go/minimax/text/v1"
	"github.com/ConnectAI-E/go-minimax/minimax"
)

type MiniMaxModelProvider struct {
	subType     string
	groupID     string
	apiKey      string
	temperature float32
}

func NewMiniMaxModelProvider(subType string, groupID string, apiKey string, temperature float32) (*MiniMaxModelProvider, error) {
	return &MiniMaxModelProvider{
		subType:     subType,
		groupID:     groupID,
		apiKey:      apiKey,
		temperature: temperature,
	}, nil
}

func (p *MiniMaxModelProvider) GetPricing() string {
	return `URL:
https://www.minimaxi.com/price

Model         | Input Price Per Thousand tokens | Output Price Per Thousand tokens
--------------|--------------------------------|--------------------------------
MiniMax-M1    | 0.0008 CNY                    | 0.008 CNY
MiniMax-Text-01| 0.001 CNY                     | 0.008 CNY
MiniMax-VL-01 | 0.001 CNY                     | 0.008 CNY
`
}

func (p *MiniMaxModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"MiniMax-M1":      {0.0008, 0.008},
		"MiniMax-Text-01": {0.001, 0.008},
		"MiniMax-VL-01":   {0.001, 0.008},
	}

	if pricePerThousandTokens, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, pricePerThousandTokens[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, pricePerThousandTokens[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *MiniMaxModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	ctx := context.Background()
	client, err := minimax.New(
		minimax.WithApiToken(p.apiKey),
		minimax.WithGroupId(p.groupID),
	)
	if err != nil {
		return nil, err
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if getContextLength(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	req := &textv1.ChatCompletionsRequest{
		Messages: []*textv1.Message{
			{
				SenderType: "USER",
				Text:       question,
			},
		},
		Model:       p.subType,
		Temperature: p.temperature,
	}
	res, err := client.ChatCompletions(ctx, req)
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

	err = flushData(res.Choices[0].Text)
	if err != nil {
		return nil, err
	}

	totalTokens := int(res.Usage.TotalTokens)
	modelResult := &ModelResult{ResponseTokenCount: totalTokens}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
