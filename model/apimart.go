// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
	"io"
)

const ApiMartBaseUrl = "https://api.apimart.ai/v1"

type ApiMartProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewApiMartProvider(subType string, apiKey string, temperature float32, topP float32) (*ApiMartProvider, error) {
	return &ApiMartProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *ApiMartProvider) GetPricing() string {
	return `URL:
https://apimart.ai/en/pricing

APIMart is an aggregator with an OpenAI-compatible API. It proxies 500+ upstream
models and prices each one individually, so the table below only lists a few
representative models. See the URL above for the authoritative price list.

| Model                | Type  | Price                                                  |
|----------------------|-------|--------------------------------------------------------|
| gpt-image-2          | Image | from $0.006 per image                                   |
| nano-banana          | Image | $0.0125 per image                                       |
| midjourney           | Image | $0.045 - $0.2 per generation                            |
| seedream-5-0-pro     | Image | $0.036 per 1K                                           |
| sora-2 / sora-2-pro  | Video | Billed per generated second, see pricing page           |
| veo-3.1              | Video | Billed per generated second, see pricing page           |
| gpt-4o / gpt-4o-mini | Chat  | Billed per token, ~20% below the official OpenAI rates  |
| claude-sonnet-4-5    | Chat  | Billed per token, ~20% below the official Claude rates  |
| gemini-2.5-pro       | Chat  | Billed per token, ~20% below the official Gemini rates  |
`
}

func (p *ApiMartProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	// APIMart proxies hundreds of upstream models and reprices them independently, so a
	// hard-coded per-model table would be stale as soon as it is written. Report price = 0
	// instead of failing the chat request: the authoritative per-call cost is the one
	// shown in the APIMart console.
	modelResult.TotalPrice = 0
	modelResult.Currency = "USD"
	return nil
}

func (p *ApiMartProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, toolSession *ToolSession, lang string) (*ModelResult, error) {
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.apiKey, p.temperature, p.topP, 0, 0, ApiMartBaseUrl, p.subType, 0, 0, "USD")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages, toolSession, lang)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}

func (p *ApiMartProvider) ListModels() ([]string, error) {
	return openaiCompatibleListModels("APIMart", p.apiKey, ApiMartBaseUrl)
}
