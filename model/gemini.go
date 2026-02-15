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

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/proxy"
	"google.golang.org/genai"
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
	return `URL: https://ai.google.dev/gemini-api/docs/pricing
| Model                                    | Input Price (per 1M tokens)              | Output Price (per 1M tokens)            |
|------------------------------------------|------------------------------------------|-----------------------------------------|
| Gemini 2.5 Flash Preview                 | $0.15 (text/image/video), $1.00 (audio) | Non-thinking: $0.60, Thinking: $3.50    |
| Gemini 2.5 Pro Preview                   | $1.25 (≤200k), $2.50 (>200k)           | $10.00 (≤200k), $15.00 (>200k)         |
| Gemini 2.5 Flash Native Audio            | $0.50 (text), $3.00 (audio/video)      | $2.00 (text), $12.00 (audio)           |
| Gemini 2.5 Flash Preview TTS             | $0.50 (text)                            | $10.00 (audio)                          |
| Gemini 2.5 Pro Preview TTS               | $1.00 (text)                            | $20.00 (audio)                          |
| Gemini 2.0 Flash                         | $0.10 (text/image/video), $0.70 (audio) | $0.40                                   |
| Gemini 2.0 Flash-Lite                    | $0.075                                  | $0.30                                   |
| Gemini 1.5 Flash                         | $0.075 (≤128k), $0.15 (>128k)          | $0.30 (≤128k), $0.60 (>128k)           |
| Gemini 1.5 Flash-8B                      | $0.0375 (≤128k), $0.075 (>128k)        | $0.15 (≤128k), $0.30 (>128k)           |
| Gemini 1.5 Pro                           | $1.25 (≤128k), $2.50 (>128k)           | $5.00 (≤128k), $10.00 (>128k)          |
| Gemini 1.0 Pro Vision                    | $0.125                                  | $0.375                                  |
| Imagen 3                                 | $0.03 per image                         | -                                       |
| Veo 2                                    | $0.35 per second                        | -                                       |
| Gemma 3 / Gemma 3n                       | Free                                    | Free                                    |
`
}

func (p *GeminiModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	if modelResult.PromptTokenCount == 0 && modelResult.ResponseTokenCount == 0 && modelResult.TotalTokenCount != 0 {
		modelResult.ResponseTokenCount = modelResult.TotalTokenCount
	}

	var inputPricePerMillionTokens, outputPricePerMillionTokens float64

	switch {
	// Gemini 2.5 Flash Preview models (including thinking variant)
	case strings.Contains(p.subType, "gemini-2.5-flash-preview"):
		if strings.Contains(p.subType, "thinking") {
			// For thinking models, assuming text input
			inputPricePerMillionTokens = 0.15
			outputPricePerMillionTokens = 3.50 // Thinking output price
		} else if strings.Contains(p.subType, "tts") {
			inputPricePerMillionTokens = 0.50   // Text input
			outputPricePerMillionTokens = 10.00 // Audio output
		} else if strings.Contains(p.subType, "native-audio") {
			// Native audio models
			inputPricePerMillionTokens = 0.50  // Text input default
			outputPricePerMillionTokens = 2.00 // Text output default
			// Note: Would need additional context to determine if audio is being used
		} else {
			// Standard Flash Preview
			inputPricePerMillionTokens = 0.15  // Text/image/video
			outputPricePerMillionTokens = 0.60 // Non-thinking output
		}

	// Gemini 2.5 Pro Preview models
	case strings.Contains(p.subType, "gemini-2.5-pro-preview"):
		if strings.Contains(p.subType, "tts") {
			inputPricePerMillionTokens = 1.00   // Text input
			outputPricePerMillionTokens = 20.00 // Audio output
		} else {
			// Standard Pro Preview - using ≤200k pricing as default
			inputPricePerMillionTokens = 1.25
			outputPricePerMillionTokens = 10.00
		}

	// Gemini 2.0 Flash models
	case strings.Contains(p.subType, "gemini-2.0-flash"):
		if strings.Contains(p.subType, "lite") {
			inputPricePerMillionTokens = 0.075
			outputPricePerMillionTokens = 0.30
		} else if strings.Contains(p.subType, "thinking") {
			// Assuming similar to 2.5 Flash thinking pricing
			inputPricePerMillionTokens = 0.10  // Text/image/video
			outputPricePerMillionTokens = 3.50 // Thinking output (estimated)
		} else if strings.Contains(p.subType, "live") {
			// Live API pricing
			inputPricePerMillionTokens = 0.35  // Text input
			outputPricePerMillionTokens = 1.50 // Text output
		} else {
			// Standard 2.0 Flash
			inputPricePerMillionTokens = 0.10 // Text/image/video
			outputPricePerMillionTokens = 0.40
		}

	// Gemini 2.0 Pro models
	case strings.Contains(p.subType, "gemini-2.0-pro"):
		// Using similar pricing to 2.5 Pro as it's not explicitly listed
		inputPricePerMillionTokens = 1.25
		outputPricePerMillionTokens = 10.00

	// Gemini 1.5 Flash models
	case strings.Contains(p.subType, "gemini-1.5-flash"):
		if strings.Contains(p.subType, "8b") {
			// Flash-8B models - using ≤128k pricing as default
			inputPricePerMillionTokens = 0.0375
			outputPricePerMillionTokens = 0.15
		} else {
			// Standard 1.5 Flash - using ≤128k pricing as default
			inputPricePerMillionTokens = 0.075
			outputPricePerMillionTokens = 0.30
		}

	// Gemini 1.5 Pro models
	case strings.Contains(p.subType, "gemini-1.5-pro"):
		// Using ≤128k pricing as default
		inputPricePerMillionTokens = 1.25
		outputPricePerMillionTokens = 5.00

	// Gemini 1.0 Pro Vision models
	case strings.Contains(p.subType, "gemini-1.0-pro-vision"),
		strings.Contains(p.subType, "gemini-pro-vision"):
		inputPricePerMillionTokens = 0.125
		outputPricePerMillionTokens = 0.375

	// Gemma models (free)
	case strings.Contains(p.subType, "gemma-3"):
		inputPricePerMillionTokens = 0
		outputPricePerMillionTokens = 0

	// LearnLM models (assuming similar to Flash pricing)
	case strings.Contains(p.subType, "learnlm"):
		inputPricePerMillionTokens = 0.10
		outputPricePerMillionTokens = 0.40

	// Image generation models
	case strings.Contains(p.subType, "imagen-3"):
		// $0.03 per image - need special handling
		modelResult.TotalPrice = 0.03
		modelResult.Currency = "USD"
		return nil

	// Video generation models
	case strings.Contains(p.subType, "veo-2"):
		// $0.35 per second - need special handling
		// Would need video duration information
		return fmt.Errorf(i18n.Translate(lang, "model:calculatePrice() error: video generation pricing requires duration information"))

	// Experimental models (using default Flash pricing)
	case strings.Contains(p.subType, "gemini-exp"):
		inputPricePerMillionTokens = 0.10
		outputPricePerMillionTokens = 0.40

	// AQA model (assuming free as not listed)
	case p.subType == "aqa":
		inputPricePerMillionTokens = 0
		outputPricePerMillionTokens = 0

	default:
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	// Convert from per million to per token pricing
	inputPricePerToken := inputPricePerMillionTokens / 1000000
	outputPricePerToken := outputPricePerMillionTokens / 1000000

	inputPrice := float64(modelResult.PromptTokenCount) * inputPricePerToken
	outputPrice := float64(modelResult.ResponseTokenCount) * outputPricePerToken

	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	modelResult.Currency = "USD"
	return nil
}

func (p *GeminiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	ctx := context.Background()
	// Access your API key as an environment variable (see "Set up your API key" above)
	client, err := genai.NewClient(ctx,
		&genai.ClientConfig{
			APIKey:     p.secretKey,
			Backend:    genai.BackendGeminiAPI,
			HTTPClient: proxy.ProxyHttpClient,
		})
	if err != nil {
		return nil, err
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:cannot calculate tokens"))
		}
		if getContextLength(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
		}
	}

	model := client.Models

	// https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/get-token-count#gemini-get-token-count-samples-drest
	// has to use CountToken() to get
	contents := []*genai.Content{
		genai.NewContentFromText(question, genai.RoleUser),
	}
	promptTokenCountResp, err := client.Models.CountTokens(ctx, p.subType, contents, nil)
	if err != nil {
		return nil, err
	}

	messages := GenaiRawMessagesToMessages(question, history)
	resp, err := model.GenerateContent(ctx, p.subType, messages, nil)
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	flushData := func(data []*genai.Part) error {
		for _, message := range data {
			if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", message.Text); err != nil {
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

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
