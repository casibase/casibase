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
	"github.com/casibase/casibase/embedding"
)

type HierarchySearchProvider struct {
	owner string
}

func NewHierarchySearchProvider(owner string) (*HierarchySearchProvider, error) {
	return &HierarchySearchProvider{owner: owner}, nil
}

func (p *HierarchySearchProvider) Search(storeName string, embeddingProviderName string, embeddingProviderObj embedding.EmbeddingProvider, modelProviderName string, text string, knowledgeCount int) ([]Vector, *embedding.EmbeddingResult, error) {
	return nil, nil, nil
}
