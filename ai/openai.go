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

package ai

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type OpenaiGpt3p5ModelProvider struct {
	SecretKey string
}

func NewOpenaiGpt3p5ModelProvider(secretKey string) (*OpenaiGpt3p5ModelProvider, error) {
	p := &OpenaiGpt3p5ModelProvider{
		SecretKey: secretKey,
	}
	return p, nil
}

func (p *OpenaiGpt3p5ModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := getProxyClientFromToken(p.SecretKey)

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	// https://platform.openai.com/tokenizer
	// https://github.com/pkoukk/tiktoken-go#available-encodings
	promptTokens, err := GetTokenSize(openai.GPT3TextDavinci003, question)
	if err != nil {
		return err
	}

	// https://platform.openai.com/docs/models/gpt-3-5
	maxTokens := 4097 - promptTokens

	respStream, err := client.CreateCompletionStream(
		ctx,
		openai.CompletionRequest{
			Model:     openai.GPT3TextDavinci003,
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

		fmt.Printf("%s", data)

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
