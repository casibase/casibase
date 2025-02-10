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

import (
	"fmt"
	"math"
	"sort"
)

func dot(vec1, vec2 []float32) float32 {
	if len(vec1) != len(vec2) {
		panic("Vector lengths do not match")
	}

	dotProduct := float32(0.0)
	for i := range vec1 {
		dotProduct += vec1[i] * vec2[i]
	}
	return dotProduct
}

func norm(vec []float32) float32 {
	normSquared := float32(0.0)
	for _, val := range vec {
		normSquared += val * val
	}
	return float32(math.Sqrt(float64(normSquared)))
}

func cosineSimilarity(vec1, vec2 []float32, vec1Norm float32) float32 {
	dotProduct := dot(vec1, vec2)
	vec2Norm := norm(vec2)
	if vec2Norm == 0 {
		return 0.0
	}
	return dotProduct / (vec1Norm * vec2Norm)
}

type SimilarityIndex struct {
	Similarity float32
	Index      int
}

func getNearestVectors(target []float32, vectors [][]float32, n int) ([]SimilarityIndex, error) {
	targetNorm := norm(target)

	similarities := []SimilarityIndex{}
	for i, vector := range vectors {
		if len(target) != len(vector) {
			return nil, fmt.Errorf("The target vector's length: [%d] should equal to knowledge vector's length: [%d], target vector = %v, knowledge vector = %v", len(target), len(vector), target, vector)
		}

		similarity := cosineSimilarity(target, vector, targetNorm)
		similarities = append(similarities, SimilarityIndex{similarity, i})
	}

	sort.Slice(similarities, func(i, j int) bool {
		return similarities[i].Similarity > similarities[j].Similarity
	})

	if n > len(similarities) {
		n = len(similarities)
	}
	res := similarities[:n]
	return res, nil
}
