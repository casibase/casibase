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

	cohereembedder "github.com/henomis/lingoose/embedder/cohere"
)

type CohereEmbeddingProvider struct {
	subType   string
	secretKey string
}

func NewCohereEmbeddingProvider(subType string, secretKey string) (*CohereEmbeddingProvider, error) {
	return &CohereEmbeddingProvider{subType: subType, secretKey: secretKey}, nil
}

func (c *CohereEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, error) {
	client := cohereembedder.New().WithModel(cohereembedder.EmbedderModel(c.subType)).WithAPIKey(c.secretKey)
	embed, err := client.Embed(ctx, []string{text})
	if err != nil {
		return nil, err
	}

	return float64ToFloat32(embed[0]), nil
}
