// Copyright 2024 The casbin Authors. All Rights Reserved.
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

import (
	"fmt"

	annoyindex "github.com/oligo/annoy-go"
)

type AnnoySearchProvider struct {
	owner string
}

func NewAnnoySearchProvider(owner string) (*AnnoySearchProvider, error) {
	return &AnnoySearchProvider{owner: owner}, nil
}

func (p *AnnoySearchProvider) Search(embeddingProviderName string, qVector []float32) ([]Vector, error) {
	// load indexing from disk
	indexingFile := fmt.Sprintf("data/indexing/embeddings_%s.ann", embeddingProviderName)
	index := annoyindex.NewAnnoyIndexAngular(len(qVector))
	index.Load(indexingFile, true)

	// get top-5 nearest vector from indexing
	result := []int{}
	distances := []float32{}
	index.GetNnsByVector(qVector, 5, 2000, &result, &distances)

	var res []Vector
	for i, idx := range result {
		vectorData := []float32{}
		index.GetItem(idx, &vectorData)
		vector, err := getVectorByData(vectorData)
		if err != nil {
			return nil, err
		}
		vector.Score = distances[i]
		res = append(res, *vector)
	}
	index.Unload()
	return res, nil
}
