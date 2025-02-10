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
	"fmt"
	"io"
	"strings"

	"github.com/gage-technologies/mistral-go"
)

type MistralModelProvider struct {
	client    *mistral.MistralClient
	modelName string
}

func NewMistralProvider(apiKey, modelName string) (*MistralModelProvider, error) {
	client := mistral.NewMistralClientDefault(apiKey)

	return &MistralModelProvider{
		client:    client,
		modelName: modelName,
	}, nil
}

func (c *MistralModelProvider) GetPricing() string {
	return `URL: https://mistral.ai/technology/#pricing

	| Model                               | Input Price($) per 1K tokens  | Output Price($) per 1K tokens  |
	|-------------------------------------|-------------------------------|--------------------------------|
	| mistral-large-latest                | 0.002                         | 0.006                          |
	| pixtral-large-latest                | 0.002                         | 0.006                          |
	| mistral-small-latest                | 0.0002                        | 0.0006                         |
	| codestral-latest                    | 0.0003                        | 0.0009                         |
	| ministral-8b-latest                 | 0.0001                        | 0.0001                         |
	| ministral-3b-latest                 | 0.00004                       | 0.00004                        |
	| pixtral-12b                         | 0.00015                       | 0.00015                        |
	| mistral-nemo                        | 0.00015                       | 0.00015                        |
	| open-mistral-7b                     | 0.00025                       | 0.00025                        |
	| open-mixtral-8x7b                   | 0.0007                        | 0.0007                         |
	| open-mixtral-8x22b                  | 0.002                         | 0.006                          |
	`
}

func (c *MistralModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"mistral-large-latest": {0.002, 0.006},
		"pixtral-large-latest": {0.002, 0.006},
		"mistral-small-latest": {0.0002, 0.0006},
		"codestral-latest":     {0.0003, 0.0009},
		"ministral-8b-latest":  {0.0001, 0.0001},
		"ministral-3b-latest":  {0.00004, 0.0001},
		"pixtral-12b":          {0.00015, 0.00015},
		"mistral-nemo":         {0.00015, 0.00015},
		"open-mistral-7b":      {0.00025, 0.00025},
		"open-mixtral-8x7b ":   {0.002, 0.002},
		"open-mixtral-8x22b":   {0.002, 0.006},
	}

	if priceItem, ok := priceTable[c.modelName]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", c.modelName)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "USD"
	return nil
}

func (c *MistralModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	chatRes, err := c.client.Chat(c.modelName, []mistral.ChatMessage{{Content: question, Role: mistral.RoleUser}}, nil)
	if err != nil {
		return nil, fmt.Errorf("error getting chat completion: %v", err)
	}

	respText := chatRes.Choices[0].Message.Content
	respText = strings.TrimSpace(respText)

	_, err = fmt.Fprint(writer, respText)
	if err != nil {
		return nil, fmt.Errorf("failed to write response: %v", err)
	}

	modelResult, err := getDefaultModelResult(c.modelName, question, respText)
	if err != nil {
		return nil, err
	}

	err = c.calculatePrice(modelResult)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate price: %v", err)
	}
	modelResult.PromptTokenCount += len(question)

	return modelResult, nil
}
