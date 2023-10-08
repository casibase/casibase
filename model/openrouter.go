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

	"github.com/Lok-Lu/go-openrouter"
	"github.com/casibase/casibase/proxy"
)

type OpenRouterModelProvider struct {
	subType     string
	secretKey   string
	siteName    string
	siteUrl     string
	temperature *float32
	topP        *float32
}

func NewOpenRouterModelProvider(subType string, secretKey string, temperature float32, topP float32) (*OpenRouterModelProvider, error) {
	p := &OpenRouterModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		siteName:    "Casibase",
		siteUrl:     "https://casibase.org",
		temperature: &temperature,
		topP:        &topP,
	}
	return p, nil
}

func (p *OpenRouterModelProvider) getProxyClientFromToken() *openrouter.Client {
	config, err := openrouter.DefaultConfig(p.secretKey, p.siteName, p.siteUrl)
	if err != nil {
		panic(err)
	}

	config.HTTPClient = proxy.ProxyHttpClient

	c := openrouter.NewClientWithConfig(config)
	return c
}

func (p *OpenRouterModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := p.getProxyClientFromToken()

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}

	model := p.subType
	if model == "" {
		model = openrouter.Gpt35Turbo
	}

	tokenCount, err := GetTokenSize(model, question)
	if err != nil {
		return err
	}

	maxTokens := 4097 - tokenCount
	if maxTokens < 0 {
		return fmt.Errorf("The token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", tokenCount, model, 4097)
	}

	temperature := p.temperature
	topP := p.topP

	respStream, err := client.CreateChatCompletionStream(
		ctx,
		&openrouter.ChatCompletionRequest{
			Model: p.subType,
			Messages: []openrouter.ChatCompletionMessage{
				{
					Role:    openrouter.ChatMessageRoleSystem,
					Content: "You are a helpful assistant.",
				},
				{
					Role:    openrouter.ChatMessageRoleUser,
					Content: question,
				},
			},
			Stream:      false,
			Temperature: temperature,
			TopP:        topP,
			MaxTokens:   maxTokens,
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

		data := completion.Choices[0].Message.Content
		if isLeadingReturn && len(data) != 0 {
			if strings.Count(data, "\n") == len(data) {
				continue
			} else {
				isLeadingReturn = false
			}
		}

		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
	}

	return nil
}
