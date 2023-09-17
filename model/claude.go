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
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/madebywelch/anthropic-go/pkg/anthropic"
)

type ClaudeModelProvider struct {
	subType   string
	secretKey string
}

func NewClaudeModelProvider(subType string, secretKey string) (*ClaudeModelProvider, error) {
	return &ClaudeModelProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *ClaudeModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client, err := anthropic.NewClient(p.secretKey)
	if err != nil {
		panic(err)
	}
	response, _ := client.Complete(&anthropic.CompletionRequest{
		Prompt:            anthropic.GetPrompt(question),
		Model:             anthropic.Model(p.subType),
		MaxTokensToSample: 100,
		StopSequences:     []string{"\r", "Human:"},
	}, nil)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
		return nil
	}
	err = flushData(response.Completion)
	if err != nil {
		return err
	}
	return nil
}
