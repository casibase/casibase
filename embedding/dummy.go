// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
	"math"
	"strings"
)

type DummyEmbeddingProvider struct {
	subType string
}

func NewDummyEmbeddingProvider(subType string) (*DummyEmbeddingProvider, error) {
	p := &DummyEmbeddingProvider{
		subType: subType,
	}
	return p, nil
}

func (p *DummyEmbeddingProvider) GetPricing() string {
	return `URL:
This is dummy embedding provider

Embedding models:

This is dummy embedding provider
`
}

func hashString(s string) int {
	hash := 0
	for i := 0; i < len(s); i++ {
		hash = 31*hash + int(s[i])
	}
	return hash
}

func (p *DummyEmbeddingProvider) QueryVector(text string, ctx context.Context) ([]float32, *EmbeddingResult, error) {
	dimensions := 1536
	freqMap := make(map[string]int)
	words := strings.Fields(text)
	for _, word := range words {
		freqMap[strings.ToLower(word)]++
	}
	vector := make([]float32, dimensions)

	for word, freq := range freqMap {
		hash := int(math.Abs(float64(hashString(word)))) % dimensions
		vector[hash] += float32(freq)
	}

	norm := 0.0
	for _, v := range vector {
		norm += float64(v * v)
	}
	norm = math.Sqrt(norm)
	for i := range vector {
		vector[i] /= float32(norm)
	}
	return vector, &EmbeddingResult{}, nil
}
