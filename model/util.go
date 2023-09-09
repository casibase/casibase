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
	"math"

	"github.com/pkoukk/tiktoken-go"
)

func GetTokenSize(model string, prompt string) (int, error) {
	tkm, err := tiktoken.EncodingForModel(model)
	if err != nil {
		return 0, err
	}

	token := tkm.Encode(prompt, nil, nil)
	res := len(token)
	return res, nil
}

func cosineSimilarity(vec1, vec2 []float32, vec1Norm float32) float32 {
	dotProduct := dot(vec1, vec2)
	vec2Norm := norm(vec2)
	if vec2Norm == 0 {
		return 0.0
	}
	return dotProduct / (vec1Norm * vec2Norm)
}

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
