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
	"strings"

	cohere "github.com/cohere-ai/cohere-go/v2"
	cohereclient "github.com/cohere-ai/cohere-go/v2/client"
)

var (
	CohereDefaultMaxTokens   int     = 256
	CohereDefaultTemperature float64 = 0.75
)

type CohereModelProvider struct {
	secretKey   string
	subType     string
	temperature float64
	maxTokens   int
	verbose     bool
	stop        []string
}

type ChatMessage struct {
	Role    string  `json:"role"`
	Message string  `json:"message"`
	User    *string `json:"user,omitempty"`
}

func NewCohereModelProvider(subType string, secretKey string) (*CohereModelProvider, error) {
	return &CohereModelProvider{
		secretKey: secretKey,
		subType:   subType,
	}, nil
}

func (c *CohereModelProvider) QueryText(message string, writer io.Writer, chat_history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
	client := cohereclient.NewClient(
		cohereclient.WithToken(c.secretKey),
	)
	ctx := context.Background()

	generation, err := client.Generate(
		ctx,
		&cohere.GenerateRequest{
			Prompt:      prompt,
			Temperature: &CohereDefaultTemperature,
			MaxTokens:   &CohereDefaultMaxTokens,
			Model:       &c.subType,
		},
	)
	if err != nil {
		return err
	}
	if len(generation.Generations) == 0 {
		return fmt.Errorf("no generations returned")
	}

	output := generation.Generations[0].Text
	resp := strings.Split(output, "\n")[0]

	_, writeErr := fmt.Fprint(writer, resp)
	if writeErr != nil {
		return writeErr
	}

	return nil
}
