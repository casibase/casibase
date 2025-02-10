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

	"github.com/casibase/casibase/proxy"
	"github.com/hupe1980/go-huggingface"
)

type HuggingFaceModelProvider struct {
	subType     string
	secretKey   string
	temperature float32
}

func NewHuggingFaceModelProvider(subType string, secretKey string, temperature float32) (*HuggingFaceModelProvider, error) {
	return &HuggingFaceModelProvider{subType: subType, secretKey: secretKey, temperature: temperature}, nil
}

func (p *HuggingFaceModelProvider) GetPricing() string {
	return `URL:
https://huggingface.co/pricing

Not charged
`
}

func (p *HuggingFaceModelProvider) calculatePrice(modelResult *ModelResult) error {
	modelResult.Currency = "USD"
	return nil
}

func (p *HuggingFaceModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	client := huggingface.NewInferenceClient(p.secretKey, func(o *huggingface.InferenceClientOptions) {
		o.HTTPClient = proxy.ProxyHttpClient
	})

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if 2048 > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	resp, err := client.TextGeneration(ctx, &huggingface.TextGenerationRequest{
		Inputs: question,
		Parameters: huggingface.TextGenerationParameters{
			Temperature: huggingface.PTR(float64(p.temperature)),
		},
		Options: huggingface.Options{
			WaitForModel: huggingface.PTR(true),
		},
		Model: p.subType,
	})
	if err != nil {
		return nil, err
	}

	respText := strings.Split(resp[0].GeneratedText, "\n")[0]

	_, err = fmt.Fprint(writer, respText)
	if err != nil {
		return nil, err
	}

	modelResult, err := getDefaultModelResult(p.subType, question, respText)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
