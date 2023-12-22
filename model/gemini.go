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

	genai "github.com/casibase/generative-ai-go/genai"
	option "google.golang.org/api/option"
)

type GeminiModelProvider struct {
	subType     string
	secretKey   string
	temperature float32
	topP        float32
	topK        int
}

func NewGeminiModelProvider(subType string, secretKey string, temperature float32, topP float32, topK int) (*GeminiModelProvider, error) {
	p := &GeminiModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		temperature: temperature,
		topP:        topP,
		topK:        topK,
	}
	return p, nil
}

func (p *GeminiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
	ctx := context.Background()
	// Access your API key as an environment variable (see "Set up your API key" above)
	client, err := genai.NewClient(ctx, option.WithAPIKey(p.secretKey))
	if err != nil {
		return err
	}
	defer client.Close()

	model := client.GenerativeModel(p.subType)
	resp, err := model.GenerateContent(ctx, genai.Text(question))
	if err != nil {
		return err
	}
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data []genai.Part) error {
		for _, message := range data {
			if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", message); err != nil {
				return err
			}
			flusher.Flush()
		}
		return nil
	}
	err = flushData(resp.Candidates[0].Content.Parts)
	if err != nil {
		return err
	}
	return nil
}
