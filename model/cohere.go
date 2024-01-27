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

	cohere "github.com/henomis/lingoose/llm/cohere"
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
    Role    string `json:"role"`
    Message string `json:"message"`
	User    *string `json:"user,omitempty"`
}

func NewCohereModelProvider(subType string, secretKey string) (*CohereModelProvider, error) {
	return &CohereModelProvider{
		secretKey: secretKey, 
		subType: subType,
	}, nil
}

func (c *CohereModelProvider) QueryText(message string, writer io.Writer, chat_history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
	client := cohere.NewCompletion().WithAPIKey(c.secretKey).WithModel(cohere.Model(c.subType))
	
	ctx := context.Background()

	resp, err := client.Completion(ctx, message)
	if err != nil {
		return err
	}

	resp = strings.Split(resp, "\n")[0]
	fmt.Println(resp)
	return nil
}
