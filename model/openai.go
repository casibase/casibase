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

func (p *OpenAiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
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

	maxTokens := getOpenAiMaxTokens(p.subType) - tokenCount
	if maxTokens < 0 {
		return fmt.Errorf("The token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", tokenCount, model, getOpenAiMaxTokens(p.subType))
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
	}

	return nil
}
