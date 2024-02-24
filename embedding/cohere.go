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

	coherego "github.com/henomis/cohere-go"
	"github.com/henomis/cohere-go/model"
	"github.com/henomis/cohere-go/request"
	"github.com/henomis/cohere-go/response"
	"github.com/henomis/lingoose/embedder"
)

type CohereEmbeddingProvider struct {
	subType   string
	secretKey string
	inputType string
}

func NewCohereEmbeddingProvider(subType string, inputType string, secretKey string) (*CohereEmbeddingProvider, error) {
	return &CohereEmbeddingProvider{
		subType:   subType,
		secretKey: secretKey,
		inputType: inputType,
	}, nil
}

func (c *CohereEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, error) {
	client := coherego.New(c.secretKey)

	// Used for embeddings stored in a vector database for search use-cases
	// mark as default
	inputType := model.EmbedInputType(c.inputType)

	embed, err := embed(ctx, client, model.EmbedModel(c.subType), &inputType, []string{text})
	if err != nil {
		return nil, err
	}

	return float64ToFloat32(embed[0]), nil
}

// copy from lingoose@v0.1.0/embedder/cohere/cohere.go
func embed(ctx context.Context, client *coherego.Client, model model.EmbedModel, inputType *model.EmbedInputType, texts []string) ([]embedder.Embedding, error) {
	resp := &response.Embed{}
	err := client.Embed(
		ctx,
		&request.Embed{
			Texts:     texts,
			Model:     model,
			InputType: inputType,
		},
		resp,
	)
	if err != nil {
		return nil, err
	}

	embeddings := make([]embedder.Embedding, len(resp.Embeddings))

	for i, embedding := range resp.Embeddings {
		embeddings[i] = embedding
	}
	return embeddings, nil
}
