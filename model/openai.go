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

	"github.com/casbin/casibase/proxy"
	"github.com/sashabaranov/go-openai"
)

type OpenAiModelProvider struct {
	subType   string
	secretKey string
}

func NewOpenAiModelProvider(subType string, secretKey string) (*OpenAiModelProvider, error) {
	return &OpenAiModelProvider{subType: subType, secretKey: secretKey}, nil
}

func getProxyClientFromToken(authToken string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.HTTPClient = proxy.ProxyHttpClient

	c := openai.NewClientWithConfig(config)
	return c
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
	promptTokens, err := GetTokenSize(model, question)
	if err != nil {
		return err
	}

	// https://platform.openai.com/docs/models/gpt-3-5
	maxTokens := 4097 - promptTokens

	respStream, err := client.CreateCompletionStream(
		ctx,
		openai.CompletionRequest{
			Model:     model,
			Prompt:    question,
			MaxTokens: maxTokens,
			Stream:    true,
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
