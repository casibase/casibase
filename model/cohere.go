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
	"context"
	"fmt"
	"io"
	"strings"

	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"
)

var (
	CohereDefaultMaxTokens   int     = 256
	CohereDefaultTemperature float64 = 0.75
)

const (
	CohereModelCommand             = "command"
	CohereModelCommandNightly      = "command-nightly"
	CohereModelCommandLight        = "command-light"
	CohereModelCommandLightNightly = "command-light-nightly"
)

type CohereModelProvider struct {
	secretKey   string
	subType     string
	temperature float64
	maxTokens   int
	verbose     bool
	stop        []string
}

type ChatMessage struct {
	Role    string  `json:"role"`
	Message string  `json:"message"`
	User    *string `json:"user,omitempty"`
}

func NewCohereModelProvider(subType string, secretKey string) (*CohereModelProvider, error) {
	return &CohereModelProvider{
		secretKey: secretKey,
		subType:   subType,
	}, nil
}

// GetPricing returns the pricing of the model
// https://cohere.com/pricing
func (c *CohereModelProvider) GetPricing() (string, string) {
	return "USB", `URL:
https://cohere.com/pricing

Generate Model:

| Model            | Type          | Input Price (Per 1,000,000 tokens) | Output Price (Per 1,000,000 tokens) |
|------------------|---------------|------------------------------------|-------------------------------------|
| Default Model    | Command       | $1.00                              | $2.00                               |
|                  | Command Light | $0.30                              | $0.60                               |
| Fine-tuned Model | Training      | $1.00                              | N/A                                 |
|                  | Command Light | $0.30                              | $0.60                               |

Embed Model:

| Model      | Cost (Per 1,000,000 tokens) |
|------------|-----------------------------|
| Default    | $0.10                       |
`
}

func (c *CohereModelProvider) caculatePrice(mr *ModelResult) {
	switch c.subType {
	case CohereModelCommand, CohereModelCommandNightly:
		mr.TotalPrice += float64(mr.PromptTokenCount) * 1.00 / 1_000_000
		mr.TotalPrice += float64(mr.ResponseTokenCount) * 2.00 / 1_000_000
	case CohereModelCommandLight, CohereModelCommandLightNightly:
		mr.TotalPrice += float64(mr.PromptTokenCount) * 0.30 / 1_000_000
		mr.TotalPrice += float64(mr.ResponseTokenCount) * 0.60 / 1_000_000
	default:
		mr.TotalPrice += float64(mr.PromptTokenCount) * 1.00 / 1_000_000
		mr.TotalPrice += float64(mr.ResponseTokenCount) * 2.00 / 1_000_000
	}
}

func (c *CohereModelProvider) QueryText(message string, writer io.Writer, chat_history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client := cohereclient.NewClient(
		cohereclient.WithToken(c.secretKey),
	)
	ctx := context.Background()

	generation, err := client.Generate(
		ctx,
		&cohere.GenerateRequest{
			Prompt:      prompt,
			Temperature: &CohereDefaultTemperature,
			MaxTokens:   &CohereDefaultMaxTokens,
			Model:       &c.subType,
		},
	)
	if err != nil {
		return nil, err
	}
	if len(generation.Generations) == 0 {
		return nil, fmt.Errorf("no generations returned")
	}

	output := generation.Generations[0].Text
	resp := strings.Split(output, "\n")[0]

	_, writeErr := fmt.Fprint(writer, resp)
	if writeErr != nil {
		return nil, writeErr
	}

	// caculate token
	modelResult := new(ModelResult)
	modelResult.PromptTokenCount = int(*generation.Meta.BilledUnits.InputTokens)
	modelResult.ResponseTokenCount = int(*generation.Meta.BilledUnits.OutputTokens)
	modelResult.TotalTokenCount = modelResult.ResponseTokenCount + modelResult.PromptTokenCount
	c.caculatePrice(modelResult)

	return modelResult, nil
}
