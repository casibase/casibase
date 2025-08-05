// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"strings"

	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
)

type HierarchySearchProvider struct {
	owner string
}

func NewHierarchySearchProvider(owner string) (*HierarchySearchProvider, error) {
	return &HierarchySearchProvider{owner: owner}, nil
}

func (p *HierarchySearchProvider) Search(storeName string, embeddingProviderName string, embeddingProviderObj embedding.EmbeddingProvider, modelProviderName string, text string, knowledgeCount int) ([]Vector, *embedding.EmbeddingResult, error) {
	vectors, err := getRelatedVectors(storeName, embeddingProviderName)
	if err != nil {
		return nil, nil, err
	}

	var (
		vectorData [][]float32
		titleMap   = make(map[string]bool)
	)
	for _, candidate := range vectors {
		if candidate.File != "" && strings.HasSuffix(candidate.File, ".md") {
			parts := strings.SplitN(candidate.Text, "\n\n", 2)
			if len(parts) > 0 {
				titleMap[parts[0]] = true
			}
			vectorData = append(vectorData, candidate.Data)
		}
	}
	titleCandidates := make([]string, 0, len(titleMap))
	for title := range titleMap {
		titleCandidates = append(titleCandidates, title)
	}

	question, _, err := getEnhancedQuestionByModel(modelProviderName, text, titleCandidates, knowledgeCount)
	if err != nil {
		return nil, nil, err
	}

	qVector, embeddingResult, err := queryVectorSafe(embeddingProviderObj, question)
	if err != nil {
		return nil, nil, err
	}
	if qVector == nil || len(qVector) == 0 {
		return nil, embeddingResult, fmt.Errorf("no qVector found")
	}

	similarities, err := getNearestVectors(qVector, vectorData, knowledgeCount)
	if err != nil {
		return nil, embeddingResult, err
	}

	res := []Vector{}
	for _, similarity := range similarities {
		vector := vectors[similarity.Index]
		vector.Score = similarity.Similarity
		res = append(res, *vector)
	}

	return res, embeddingResult, nil
}

func getEnhancedQuestionByModel(modelProviderName string, text string, titleCandidates []string, candidateTitlesNum int) (string, *model.ModelResult, error) {
	prompt := fmt.Sprintf("Please help me select the top %d titles that are most likely to contain the answer. Just return the title list. No other content.", candidateTitlesNum)

	question := fmt.Sprintf("Please select the titles most relevant to the following question and choose the %v most relevant items. Just return the title list. No other content.\nquestion:\n %s \n\nTitles: \n%s", candidateTitlesNum, text, "• "+strings.Join(titleCandidates, "\n• "))

	history := []*model.RawMessage{}
	knowledge := []*model.RawMessage{}
	res, modelResult, err := GetAnswerWithContext(modelProviderName, question, history, knowledge, prompt)
	if err != nil {
		return "", nil, err
	}
	enhancedQuestion := fmt.Sprintf("%s\n\nrelated contents: %s", text, res)
	return enhancedQuestion, modelResult, nil
}
