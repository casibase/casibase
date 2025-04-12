// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

package object

type DefaultSearchProvider struct {
	owner string
}

func NewDefaultSearchProvider(owner string) (*DefaultSearchProvider, error) {
	return &DefaultSearchProvider{owner: owner}, nil
}

func (p *DefaultSearchProvider) Search(embeddingProviderName string, qVector []float32, knowledgeCount int) ([]Vector, error) {
	vectors, err := getRelatedVectors(embeddingProviderName)
	if err != nil {
		return nil, err
	}

	var vectorData [][]float32
	for _, candidate := range vectors {
		vectorData = append(vectorData, candidate.Data)
	}

	similarities, err := getNearestVectors(qVector, vectorData, knowledgeCount)
	if err != nil {
		return nil, err
	}

	res := []Vector{}
	for _, similarity := range similarities {
		vector := vectors[similarity.Index]
		vector.Score = similarity.Similarity
		res = append(res, *vector)
	}

	return res, nil
}
