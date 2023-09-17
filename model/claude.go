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

	"github.com/ConnectAI-E/go-claude/claude"
	textv1 "github.com/ConnectAI-E/go-claude/gen/go/claude/text/v1"
)

type ClaudeModelProvider struct {
	subType   string
	secretKey string
}

func NewClaudeModelProvider(subType string, secretKey string) (*ClaudeModelProvider, error) {
	return &ClaudeModelProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *ClaudeModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	ctx := context.Background()
	client, _ := claude.New(
		claude.WithApiToken(p.secretKey),
	)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	req := &textv1.ChatCompletionsRequest{
		Messages: []*textv1.Message{
			{
				Role:    "Human",
				Content: question,
			},
		},
		Model:             p.subType,
		Temperature:       0.7,
		MaxTokensToSample: 1200,
	}
	res, _ := client.ChatCompletions(ctx, req)
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
		return nil
	}
	err := flushData(res.Completion)
	if err != nil {
		return err
	}
	return nil
}
