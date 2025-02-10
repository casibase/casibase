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

	genai "github.com/casibase/generative-ai-go/genai"
	option "google.golang.org/api/option"
)

type GeminiModelProvider struct {
	subType     string
	secretKey   string
	temperature float32
	topP        float32
	topK        int
}

func NewGeminiModelProvider(subType string, secretKey string, temperature float32, topP float32, topK int) (*GeminiModelProvider, error) {
	p := &GeminiModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		temperature: temperature,
		topP:        topP,
		topK:        topK,
	}
	return p, nil
}

func (p *GeminiModelProvider) GetPricing() string {
	return `URL:
https://cloud.google.com/vertex-ai/generative-ai/pricing

| Model                                | Input Price                            | Output Price                    |
|--------------------------------------|----------------------------------------|---------------------------------|
| Gemini 1.0 pro                       | $0.000125/1K characters, $0.0025/image | $0.000375/1K characters         |

| Model                                | Input Price per 1K characters      | Output Price per 1K characters  |
|--------------------------------------|------------------------------------|---------------------------------|
| PaLM 2 for Text (Text Bison)         | Online: $0.00025, Batch: $0.00020  | Online: $0.0005, Batch: $0.0004 |
| PaLM 2 for Text 32k (Text Bison 32k) | Online: $0.00025, Batch: $0.00020  | Online: $0.0005, Batch: $0.0004 |
| PaLM 2 for Text (Text Unicorn)       | Online: $0.0025, Batch: $0.0020    | Online: $0.0075, Batch: $0.0060 |
| PaLM 2 for Chat (Chat Bison)         | Online: $0.00025                   | Online: $0.0005                 |
| PaLM 2 for Chat 32k (Chat Bison 32k) | Online: $0.00025                   | Online: $0.0005                 |
| Embeddings for Text                  | Online: $0.000025, Batch: $0.00002 | No charge                       |
| Codey for Code Generation            | Online: $0.00025, Batch: $0.00020  | Online: $0.0005, Batch: $0.0004 |
| Codey for Code Generation 32k        | Online: $0.00025                   | Online: $0.0005                 |
| Codey for Code Chat                  | Online: $0.00025                   | Online: $0.0005                 |
| Codey for Code Chat 32k              | Online: $0.00025                   | Online: $0.0005                 |
| Codey for Code Completion            | Online: $0.00025                   | Online: $0.0005                 |
`
}

func (p *GeminiModelProvider) calculatePrice(modelResult *ModelResult) error {
	if modelResult.PromptTokenCount == 0 && modelResult.ResponseTokenCount == 0 && modelResult.TotalTokenCount != 0 {
		modelResult.ResponseTokenCount = modelResult.TotalTokenCount
	}

	var inputPricePerThousandTokens, outputPricePerThousandTokens float64
	switch {
	case strings.Contains(p.subType, "gemini-1.0-pro"), strings.Contains(p.subType, "gemini-pro"), strings.Contains(p.subType, "gemini-pro-vision"):
		// https://ai.google.dev/models/gemini
		// gemini-pro is an alias for gemini-1.0-pro
		inputPricePerThousandTokens = 0.000125
		outputPricePerThousandTokens = 0.000375
	// https://ai.google.dev/models/palm
	case strings.Contains(p.subType, "text-bison-001"), strings.Contains(p.subType, "text-bison-32k"):
		inputPricePerThousandTokens = 0.00025
		outputPricePerThousandTokens = 0.0005
	case strings.Contains(p.subType, "text-unicorn"):
		inputPricePerThousandTokens = 0.0025
		outputPricePerThousandTokens = 0.0075
	case strings.Contains(p.subType, "chat-bison-001"), strings.Contains(p.subType, "chat-bison-32k"):
		inputPricePerThousandTokens = 0.00025
		outputPricePerThousandTokens = 0.0005
	default:
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	modelResult.Currency = "USD"
	return nil
}

func (p *GeminiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	// Access your API key as an environment variable (see "Set up your API key" above)
	client, err := genai.NewClient(ctx, option.WithAPIKey(p.secretKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if 32000 > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	model := client.GenerativeModel(p.subType)

	// https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/get-token-count#gemini-get-token-count-samples-drest
	// has to use CountToken() to get
	promptTokenCountResp, err := model.CountTokens(ctx, genai.Text(question))
	if err != nil {
		return nil, err
	}

	resp, err := model.GenerateContent(ctx, genai.Text(question))
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	flushData := func(data []genai.Part) error {
		for _, message := range data {
			if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", message); err != nil {
				return err
			}
			flusher.Flush()
		}
		return nil
	}

	err = flushData(resp.Candidates[0].Content.Parts)
	if err != nil {
		return nil, err
	}

	respTokenCount := int(resp.Candidates[0].TokenCount)
	promptTokenCount := int(promptTokenCountResp.TotalTokens)
	modelResult := &ModelResult{
		PromptTokenCount:   promptTokenCount,
		ResponseTokenCount: respTokenCount,
		TotalTokenCount:    promptTokenCount + respTokenCount,
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
