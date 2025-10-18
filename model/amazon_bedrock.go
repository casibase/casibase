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
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/casibase/casibase/i18n"
)

type AmazonBedrockModelProvider struct {
	temperature float64
	subType     string
	secretKey   string
}

func NewAmazonBedrockModelProvider(subType string, secretKey string, temperature float64) (*AmazonBedrockModelProvider, error) {
	client := &AmazonBedrockModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		temperature: temperature,
	}
	return client, nil
}

func (a AmazonBedrockModelProvider) GetPricing() string {
	return `URL: https://aws.amazon.com/cn/bedrock/pricing/

Model 
| Model                       | Unit Of Charge                | Price    |
|-----------------------------|-------------------------------|----------|
| Claude Opus 4               | 1K input tokens               | $0.015   |
| Claude Opus 4               | 1K output tokens              | $0.075   |
| Claude Sonnet 4             | 1K input tokens               | $0.003   |
| Claude Sonnet 4             | 1K output tokens              | $0.015   |
| Claude Instant              | 1K input tokens               | $0.0008  |
| Claude Instant              | 1K output tokens              | $0.0024  |
| Command R                   | 1K input tokens               | $0.0005  |
| Command R                   | 1K output tokens              | $0.0015  |
| Command R+                  | 1K input tokens               | $0.003   |
| Command R+                  | 1K output tokens              | $0.015   |
| Command-Light               | 1K input tokens               | $0.0003  |
| Command-Light               | 1K output tokens              | $0.0006  |
| Embed - English             | 1K input tokens               | $0.0001  |
| Embed - Multilingual        | 1K input tokens               | $0.0001  |
| Jurassic-2 Mid              | 1K input tokens               | $0.0125  |
| Jurassic-2 Mid              | 1K output tokens              | $0.0125  |
| Jurassic-2 Ultra            | 1K input tokens               | $0.0188  |
| Jurassic-2 Ultra            | 1K output tokens              | $0.0188  |
| Llama 4 Maverick 17B        | 1K input tokens               | $0.00024 |
| Llama 4 Maverick 17B        | 1K output tokens              | $0.00097 |
| Llama 4 Scout 17B           | 1K input tokens               | $0.00017 |
| Llama 4 Scout 17B           | 1K output tokens              | $0.00066 |
| Titan Text Premier          | 1K input tokens               | $0.0005  |
| Titan Text Premier          | 1K output tokens              | $0.0015  |
| Titan Text Lite             | 1K input tokens               | $0.00015 |
| Titan Text Lite             | 1K output tokens              | $0.0002  |
| Titan Text Express          | 1K input tokens               | $0.0002  |
| Titan Text Express          | 1K output tokens              | $0.0006  |
| Titan Embeddings            | 1K input tokens               | $0.0001  |
| Titan Embeddings V2         | 1K input tokens               | $0.00002 |
| Titan Multimodal Embeddings | 1K input tokens               | $0.0008  |
| Titan Multimodal Embeddings | 1 input image                 | $0.00006 |

`
}

func (p *AmazonBedrockModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	prices := map[string]struct {
		InputTokenPrice  float64
		OutputTokenPrice float64
	}{
		"Claude Opus4":                {0.015, 0.075},
		"Claude Sonnet4":              {0.003, 0.015},
		"Claude Instant":              {0.0008, 0.0024},
		"Command R":                   {0.0005, 0.0015},
		"Command R+":                  {0.003, 0.015},
		"Command-Light":               {0.0003, 0.0006},
		"Embed - English":             {0.0001, 0},
		"Embed - Multilingual":        {0.0001, 0},
		"Jurassic-2 Mid":              {0.0125, 0.0125},
		"Jurassic-2 Ultra":            {0.0188, 0.0188},
		"Llama4 Maverick17B":          {0.00024, 0.00097},
		"Llama4 Scout17B":             {0.00017, 0.00066},
		"Titan Text Premier":          {0.0005, 0.0015},
		"Titan Text Lite":             {0.00015, 0.0002},
		"Titan Text Express":          {0.0002, 0.0006},
		"Titan Embeddings":            {0.0001, 0},
		"Titan Embeddings V2":         {0.00002, 0},
		"Titan Multimodal Embeddings": {0.0008, 0},
	}
	price, ok := prices[p.subType]
	if !ok {
		return fmt.Errorf(i18n.Translate(lang, "model:unsupported model: %s"), p.subType)
	}
	inputTokenPrice := float64(modelResult.PromptTokenCount) / 1000.0 * price.InputTokenPrice
	outputTokenPrice := float64(modelResult.ResponseTokenCount) / 1000.0 * price.OutputTokenPrice
	modelResult.TotalPrice = inputTokenPrice + outputTokenPrice
	modelResult.Currency = "USD"
	return nil
}

func (p *AmazonBedrockModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-west-2"))
	if err != nil {
		return nil, err
	}
	client := bedrockruntime.NewFromConfig(cfg)

	maxTokens := getContextLength(p.subType)

	requestBody, err := json.Marshal(map[string]interface{}{
		"prompt":      prompt + question,
		"temperature": p.temperature,
		"max_tokens":  maxTokens,
	})
	if err != nil {
		return nil, err
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:cannot calculate tokens"))
		}
		if maxTokens > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
		}
	}

	resp, err := client.InvokeModel(context.TODO(), &bedrockruntime.InvokeModelInput{
		ModelId:     aws.String(p.subType),
		Body:        requestBody,
		ContentType: aws.String("application/json"),
	})
	if err != nil {
		return nil, err
	}

	var result struct {
		Generation string `json:"generation"`
	}
	if err := json.Unmarshal(resp.Body, &result); err != nil {
		return nil, err
	}

	_, err = writer.Write([]byte(result.Generation))
	if err != nil {
		return nil, err
	}

	modelResult, err := getDefaultModelResult(p.subType, question, result.Generation)
	if err != nil {
		return nil, err
	}

	if err := p.calculatePrice(modelResult, lang); err != nil {
		return nil, err
	}

	return modelResult, nil
}
