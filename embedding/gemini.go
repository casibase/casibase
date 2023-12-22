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

package embedding

import (
	"context"

	genai "github.com/casibase/generative-ai-go/genai"
	option "google.golang.org/api/option"
)

type GeminiEmbeddingProvider struct {
	subType   string
	secretKey string
}

func NewGeminiEmbeddingProvider(subType string, secretKey string) (*GeminiEmbeddingProvider, error) {
	p := &GeminiEmbeddingProvider{
		subType:   subType,
		secretKey: secretKey,
	}
	return p, nil
}

func (p *GeminiEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, error) {
	// Access your API key as an environment variable (see "Set up your API key" above)
	client, err := genai.NewClient(ctx, option.WithAPIKey(p.secretKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()
	em := client.EmbeddingModel(p.subType)
	res, err := em.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return nil, err
	}
	return res.Embedding.Values, nil
}
