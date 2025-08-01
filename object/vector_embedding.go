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
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/split"
	"github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/txt"
	"github.com/casibase/casibase/util"
	"github.com/cenkalti/backoff/v4"
)

func filterTextFiles(files []*storage.Object) []*storage.Object {
	fileTypes := txt.GetSupportedFileTypes()
	fileTypeMap := map[string]bool{}
	for _, fileType := range fileTypes {
		fileTypeMap[fileType] = true
	}

	res := []*storage.Object{}
	for _, file := range files {
		ext := filepath.Ext(file.Key)
		if fileTypeMap[ext] {
			res = append(res, file)
		}
	}
	return res
}

func addEmbeddedVector(embeddingProviderObj embedding.EmbeddingProvider, text string, storeName string, fileName string, index int, embeddingProviderName string, modelSubType string) (bool, error) {
	data, embeddingResult, err := queryVectorSafe(embeddingProviderObj, text)
	if err != nil {
		return false, err
	}

	displayName := text
	if len(text) > 25 {
		displayName = string([]rune(text)[:25])
	}

	tokenCount := 0
	price := 0.0
	currency := ""
	if embeddingResult != nil {
		tokenCount = embeddingResult.TokenCount
		price = embeddingResult.Price
		currency = embeddingResult.Currency
	}

	defaultEmbeddingResult, err := embedding.GetDefaultEmbeddingResult(modelSubType, text)
	if err != nil {
		return false, err
	}

	if tokenCount == 0 {
		tokenCount = defaultEmbeddingResult.TokenCount
	}
	if price == 0 {
		price = defaultEmbeddingResult.Price
	}
	if currency == "" {
		currency = defaultEmbeddingResult.Currency
	}

	vector := &Vector{
		Owner:       "admin",
		Name:        fmt.Sprintf("vector_%s", util.GetRandomName()),
		CreatedTime: util.GetCurrentTime(),
		DisplayName: displayName,
		Store:       storeName,
		Provider:    embeddingProviderName,
		File:        fileName,
		Index:       index,
		Text:        text,
		TokenCount:  tokenCount,
		Price:       price,
		Currency:    currency,
		Data:        data,
		Dimension:   len(data),
	}
	return AddVector(vector)
}

func addVectorsForStore(storageProviderObj storage.StorageProvider, embeddingProviderObj embedding.EmbeddingProvider, prefix string, storeName string, splitProviderName string, embeddingProviderName string, modelSubType string) (bool, error) {
	var affected bool

	files, err := storageProviderObj.ListObjects(prefix)
	if err != nil {
		return false, err
	}

	files = filterTextFiles(files)

	for _, file := range files {
		var text string
		fileExt := filepath.Ext(file.Key)
		text, err = txt.GetParsedTextFromUrl(file.Url, fileExt)
		if err != nil {
			return false, err
		}

		splitProviderType := splitProviderName
		if splitProviderType == "" {
			splitProviderType = "Default"
		}

		if strings.HasPrefix(file.Key, "QA") && fileExt == ".docx" {
			splitProviderType = "QA"
		}

		if fileExt == ".md" {
			splitProviderType = "Markdown"
		}
		var splitProvider split.SplitProvider
		splitProvider, err = split.GetSplitProvider(splitProviderType)
		if err != nil {
			return false, err
		}

		var textSections []string
		textSections, err = splitProvider.SplitText(text)
		if err != nil {
			return false, err
		}

		for i, textSection := range textSections {
			var vector *Vector
			vector, err = getVectorByIndex("admin", storeName, file.Key, i)
			if err != nil {
				return false, err
			}

			if vector != nil {
				fmt.Printf("[%d/%d] Generating embedding for store: [%s], file: [%s], index: [%d]: %s\n", i+1, len(textSections), storeName, file.Key, i, "Skipped due to already exists")
				continue
			}

			fmt.Printf("[%d/%d] Generating embedding for store: [%s], file: [%s], index: [%d]: %s\n", i+1, len(textSections), storeName, file.Key, i, textSection)

			operation := func() error {
				affected, err = addEmbeddedVector(embeddingProviderObj, textSection, storeName, file.Key, i, embeddingProviderName, modelSubType)
				if err != nil {
					if isRetryableError(err) {
						return err
					}
					return backoff.Permanent(err)
				}
				return nil
			}
			err = backoff.Retry(operation, backoff.NewExponentialBackOff())
			if err != nil {
				fmt.Printf("Failed to generate embedding after retries: %v\n", err)
				return false, err
			}
		}
	}

	return affected, err
}

func getRelatedVectors(storeName string, provider string) ([]*Vector, error) {
	vectors, err := getVectorsByProvider(storeName, provider)
	if err != nil {
		return nil, err
	}
	if len(vectors) == 0 {
		return nil, fmt.Errorf("no knowledge vectors found")
	}

	return vectors, nil
}

func queryVectorWithContext(embeddingProvider embedding.EmbeddingProvider, text string, timeout int) ([]float32, *embedding.EmbeddingResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(30+timeout*2)*time.Second)
	defer cancel()
	vector, embeddingResult, err := embeddingProvider.QueryVector(text, ctx)
	return vector, embeddingResult, err
}

func queryVectorSafe(embeddingProvider embedding.EmbeddingProvider, text string) ([]float32, *embedding.EmbeddingResult, error) {
	var res []float32
	var embeddingResult *embedding.EmbeddingResult
	var err error
	for i := 0; i < 10; i++ {
		res, embeddingResult, err = queryVectorWithContext(embeddingProvider, text, i)
		if err != nil {
			err = fmt.Errorf("queryVectorSafe() error, %s", err.Error())
			if i > 0 {
				fmt.Printf("\tFailed (%d): %s\n", i+1, err.Error())
			}
		} else {
			break
		}
	}

	if err != nil {
		return nil, nil, err
	} else {
		return res, embeddingResult, nil
	}
}

func GetNearestKnowledge(storeName string, searchProviderType string, embeddingProvider *Provider, embeddingProviderObj embedding.EmbeddingProvider, modelProvider *Provider, owner string, text string, knowledgeCount int) ([]*model.RawMessage, []VectorScore, *embedding.EmbeddingResult, error) {
	searchProvider, err := GetSearchProvider(searchProviderType, owner)
	if err != nil {
		return nil, nil, nil, err
	}

	vectors, embeddingResult, err := searchProvider.Search(storeName, embeddingProvider.Name, embeddingProviderObj, modelProvider.Name, text, knowledgeCount)
	if err != nil {
		if err.Error() == "no knowledge vectors found" {
			return nil, nil, embeddingResult, err
		} else {
			return nil, nil, nil, err
		}
	}

	vectorScores := []VectorScore{}
	knowledge := []*model.RawMessage{}
	for _, vector := range vectors {
		// if embeddingProvider.Name != vector.Provider {
		//	return "", nil, fmt.Errorf("The store's embedding provider: [%s] should equal to vector's embedding provider: [%s], vector = %v", embeddingProvider.Name, vector.Provider, vector)
		// }

		vectorScores = append(vectorScores, VectorScore{
			Vector: vector.Name,
			Score:  vector.Score,
		})
		knowledge = append(knowledge, &model.RawMessage{
			Text:           vector.Text,
			Author:         "System",
			TextTokenCount: vector.TokenCount,
		})
	}

	return knowledge, vectorScores, embeddingResult, nil
}
