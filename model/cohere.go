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
	"strings"

	"github.com/casibase/casibase/i18n"
	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"
)

// https://docs.cohere.com/docs/command-beta#whats-the-context-window-on-the-command-models
var CohereDefaultTemperature float64 = 0.75

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
func (c *CohereModelProvider) GetPricing() string {
	return `URL:
https://cohere.com/pricing

Generate Model:

| Model         | Input Price (Per 1,000,000 tokens) | Output Price (Per 1,000,000 tokens) |
|---------------|------------------------------------|-------------------------------------|
| Command Light | $0.30                              | $0.60                               |
| Command       | $1.00                              | $2.00                               |

Embed Model:

| Model      | Cost (Per 1,000,000 tokens) |
|------------|-----------------------------|
| Default    | $0.10                       |
`
}

func (p *CohereModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64
	switch p.subType {
	case "command-light", "command-light-nightly":
		inputPricePerThousandTokens = 0.0003
		outputPricePerThousandTokens = 0.0006
	case "command", "command-nightly":
		inputPricePerThousandTokens = 0.001
		outputPricePerThousandTokens = 0.002
	default:
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	modelResult.Currency = "USD"
	return nil
}

func (p *CohereModelProvider) QueryText(message string, writer io.Writer, chat_history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	client := cohereclient.NewClient(
		cohereclient.WithToken(p.secretKey),
	)
	ctx := context.Background()

	// if p.maxTokens > 0, use p.maxTokens, otherwise use model's default Maxtokens
	maxTokens := getContextLength(p.subType)
	if strings.HasPrefix(message, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, message, "")
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:cannot calculate tokens"))
		}
		if maxTokens > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
		}
	}
	generation, err := client.Generate(
		ctx,
		&cohere.GenerateRequest{
			Prompt:      prompt,
			Temperature: &CohereDefaultTemperature,
			MaxTokens:   &maxTokens,
			Model:       &p.subType,
		},
	)
	if err != nil {
		return nil, err
	}
	if len(generation.Generations) == 0 {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:no generations returned"))
	}

	output := generation.Generations[0].Text
	resp := strings.Split(output, "\n")[0]

	_, err = fmt.Fprint(writer, resp)
	if err != nil {
		return nil, err
	}

	promptTokenCount := int(*generation.Meta.BilledUnits.InputTokens)
	responseTokenCount := int(*generation.Meta.BilledUnits.OutputTokens)
	modelResult := &ModelResult{PromptTokenCount: promptTokenCount, ResponseTokenCount: responseTokenCount}
	modelResult.TotalTokenCount = modelResult.ResponseTokenCount + modelResult.PromptTokenCount

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
