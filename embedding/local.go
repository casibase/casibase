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

	"github.com/sashabaranov/go-openai"
)

type LocalEmbeddingProvider struct {
	typ            string
	subType        string
	deploymentName string
	secretKey      string
	providerUrl    string
	apiVersion     string
}

func NewLocalEmbeddingProvider(typ string, subType string, secretKey string, providerUrl string) (*LocalEmbeddingProvider, error) {
	p := &LocalEmbeddingProvider{
		typ:         typ,
		subType:     subType,
		secretKey:   secretKey,
		providerUrl: providerUrl,
	}
	return p, nil
}

func getLocalClientFromUrl(authToken string, url string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.BaseURL = url

	c := openai.NewClientWithConfig(config)
	return c
}

func (p *LocalEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, error) {
	var client *openai.Client
	if p.typ == "Local" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
	} else if p.typ == "Azure" {
		client = getAzureClientFromToken(p.deploymentName, p.secretKey, p.providerUrl, p.apiVersion)
	}

	resp, err := client.CreateEmbeddings(ctx, openai.EmbeddingRequest{
		Input: []string{text},
		Model: openai.EmbeddingModel(1),
	})
	if err != nil {
		return nil, err
	}

	return resp.Data[0].Embedding, nil
}
