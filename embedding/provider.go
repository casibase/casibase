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

import "context"

type EmbeddingProvider interface {
	QueryVector(text string, ctx context.Context) ([]float32, error)
}

func GetEmbeddingProvider(typ string, subType string, clientId string, clientSecret string, providerUrl string, apiVersion string) (EmbeddingProvider, error) {
	var p EmbeddingProvider
	var err error
	if typ == "OpenAI" {
		p, err = NewOpenAiEmbeddingProvider(subType, clientSecret)
	} else if typ == "Hugging Face" {
		p, err = NewHuggingFaceEmbeddingProvider(subType, clientSecret)
	} else if typ == "Cohere" {
		p, err = NewCohereEmbeddingProvider(subType, clientSecret)
	} else if typ == "Ernie" {
		p, err = NewErnieEmbeddingProvider(subType, clientId, clientSecret)
	} else if typ == "Local" {
		p, err = NewLocalEmbeddingProvider(typ, subType, clientSecret, providerUrl)
	} else if typ == "Azure" {
		p, err = NewAzureEmbeddingProvider(typ, subType, clientId, clientSecret, providerUrl, apiVersion)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}
