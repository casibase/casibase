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
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	annoyindex "github.com/oligo/annoy-go"
)

var (
	markDeleted  []string = []string{}
	vectorHashes          = make(map[string]string)
)

func ReIndexing(embeddingProviderName string) {
	indexingFile := fmt.Sprintf("data/indexing/embeddings_%s.ann", embeddingProviderName)

	vectors, err := getRelatedVectors(embeddingProviderName)
	if err != nil {
		panic(err)
	}

	if len(vectors) == 0 {
		panic(fmt.Errorf("no vectors found"))
	}
	index := annoyindex.NewAnnoyIndexAngular(len(vectors[0].Data))

	nTrees := 10
	defer func() {
		index.Build(nTrees)
		err := index.Save(indexingFile, false)
		if err != true {
			panic("Saving indexing failed")
		}
		index.Unload()
	}()
	for i, vector := range vectors {
		index.AddItem(i, vector.Data)
	}
}

func ReIndexingForProviders(embeddingProviderNameList []string) {
	for _, embeddingProvider := range embeddingProviderNameList {
		ReIndexing(embeddingProvider)

		// remove it from markDeleted
		for i, v := range markDeleted {
			if v == embeddingProvider {
				markDeleted = append(markDeleted[:i], markDeleted[i+1:]...)
			}
		}
	}
}

func CalculateVectorHash(vector []*Vector) map[string]string {
	providerHashes := make(map[string]string)
	for _, entry := range vector {
		hash := HashData(entry.Data)
		if existingHash, exists := providerHashes[entry.Provider]; exists {
			// from vector from same provider, we can combine them
			combinedHash := sha256.New()
			combinedHash.Write([]byte(existingHash + hash))
			providerHashes[entry.Provider] = hex.EncodeToString(combinedHash.Sum(nil))
		} else {
			providerHashes[entry.Provider] = hash
		}
	}
	return providerHashes
}

func CompareAllHashes(newHashes map[string]string) []string {
	var modified []string

	if len(vectorHashes) == 0 {
		vectorHashes = newHashes
		for provider := range newHashes {
			modified = append(modified, provider)
		}
		return modified
	}

	for provider, oldHash := range vectorHashes {
		if newHash, exists := newHashes[provider]; exists {
			if oldHash != newHash {
				modified = append(modified, provider)
			}
		} else {
			modified = append(modified, provider)
		}
	}

	for provider := range newHashes {
		if _, exists := vectorHashes[provider]; !exists {
			modified = append(modified, provider)
		}
	}
	// update vectorHashes
	vectorHashes = newHashes
	return modified
}

func CheckAndReIndexing(vector []*Vector) {
	newHashes := CalculateVectorHash(vector)
	modifiedProviders := CompareAllHashes(newHashes)
	if len(modifiedProviders) > 0 {
		ReIndexingForProviders(modifiedProviders)
	}
}

func StartAnnoyDeleteTimer() {
	ticker := time.NewTicker(15 * time.Minute)
	go func() {
		for {
			<-ticker.C
			ReIndexingForProviders(markDeleted)
		}
	}()
}

func HashData(data []float32) string {
	hasher := sha256.New()
	for _, value := range data {
		b := make([]byte, 4)
		for i := 0; i < 4; i++ {
			b[i] = byte(value)
			value /= 256
		}
		hasher.Write(b)
	}
	return hex.EncodeToString(hasher.Sum(nil))
}

func MarkDeleted(provider string) {
	exists := false

	for _, item := range markDeleted {
		if item == provider {
			exists = true
			break
		}
	}

	if !exists {
		markDeleted = append(markDeleted, provider)
	}
}
