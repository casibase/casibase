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
	"net/http"
	"strings"

	"github.com/casibase/casibase/proxy"
	"github.com/sashabaranov/go-openai"
)

// https://pkg.go.dev/github.com/sashabaranov/go-openai@v1.12.0#pkg-constants
// https://platform.openai.com/docs/models/overview
var __maxTokens = map[string]int{
	openai.GPT4:                 8192,
	openai.GPT40613:             8192,
	openai.GPT432K:              32768,
	openai.GPT432K0613:          32768,
	openai.GPT40314:             8192,
	openai.GPT432K0314:          32768,
	openai.GPT3Dot5Turbo:        4097,
	openai.GPT3Dot5Turbo16K:     16385,
	openai.GPT3Dot5Turbo0613:    4097,
	openai.GPT3Dot5Turbo16K0613: 16385,
	openai.GPT3Dot5Turbo0301:    4097,
	openai.GPT3TextDavinci003:   4097,
	openai.GPT3TextDavinci002:   4097,
	openai.GPT3TextCurie001:     2049,
	openai.GPT3TextBabbage001:   2049,
	openai.GPT3TextAda001:       2049,
	openai.GPT3Davinci:          2049,
	openai.GPT3Curie:            2049,
	openai.GPT3Ada:              2049,
	openai.GPT3Babbage:          2049,
}

type OpenAiModelProvider struct {
	subType          string
	secretKey        string
	temperature      float32
	topP             float32
	frequencyPenalty float32
	presencePenalty  float32
}

func NewOpenAiModelProvider(subType string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32) (*OpenAiModelProvider, error) {
	p := &OpenAiModelProvider{
		subType:          subType,
		secretKey:        secretKey,
		temperature:      temperature,
		topP:             topP,
		frequencyPenalty: frequencyPenalty,
		presencePenalty:  presencePenalty,
	}
	return p, nil
}

func getProxyClientFromToken(authToken string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.HTTPClient = proxy.ProxyHttpClient

	c := openai.NewClientWithConfig(config)
	return c
}

// GetMaxTokens returns the max tokens for a given openai model.
func (p *OpenAiModelProvider) GetMaxTokens() int {
	res, ok := __maxTokens[p.subType]
	if !ok {
		return 4097
	}
	return res
}

func (p *OpenAiModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := getProxyClientFromToken(p.secretKey)

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}

	model := p.subType
	if model == "" {
		model = openai.GPT3TextDavinci003
	}

	// https://platform.openai.com/tokenizer
	// https://github.com/pkoukk/tiktoken-go#available-encodings
	tokenCount, err := GetTokenSize(model, question)
	if err != nil {
		return err
	}

	maxTokens := p.GetMaxTokens() - tokenCount
	if maxTokens < 0 {
		return fmt.Errorf("The token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", tokenCount, model, p.GetMaxTokens())
	}

	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty

	respStream, err := client.CreateCompletionStream(
		ctx,
		openai.CompletionRequest{
			Model:            model,
			Prompt:           question,
			MaxTokens:        maxTokens,
			Stream:           true,
			Temperature:      temperature,
			TopP:             topP,
			FrequencyPenalty: frequencyPenalty,
			PresencePenalty:  presencePenalty,
		},
	)
	if err != nil {
		return err
	}
	defer respStream.Close()

	isLeadingReturn := true
	for {
		completion, streamErr := respStream.Recv()
		if streamErr != nil {
			if streamErr == io.EOF {
				break
			}
			return streamErr
		}

		data := completion.Choices[0].Text
		if isLeadingReturn && len(data) != 0 {
			if strings.Count(data, "\n") == len(data) {
				continue
			} else {
				isLeadingReturn = false
			}
		}

		// Write the streamed data as Server-Sent Events
		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		// Append the response to the strings.Builder
		builder.WriteString(data)
	}

	return nil
}
