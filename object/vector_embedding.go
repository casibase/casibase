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

package object

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/casbin/casibase/embedding"
	"github.com/casbin/casibase/storage"
	"github.com/casbin/casibase/txt"
	"github.com/casbin/casibase/util"
	"golang.org/x/time/rate"
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

func addEmbeddedVector(embeddingProviderObj embedding.EmbeddingProvider, text string, storeName string, fileName string, index int, embeddingProviderName string) (bool, error) {
	data, err := queryVectorSafe(embeddingProviderObj, text)
	if err != nil {
		return false, err
	}

	displayName := text
	if len(text) > 25 {
		displayName = text[:25]
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
		Data:        data,
		Dimension:   len(data),
	}
	return AddVector(vector)
}

func addVectorsForStore(storageProviderObj storage.StorageProvider, embeddingProviderObj embedding.EmbeddingProvider, prefix string, storeName string, embeddingProviderName string) (bool, error) {
	var affected bool

	files, err := storageProviderObj.ListObjects(prefix)
	if err != nil {
		return false, err
	}

	files = filterTextFiles(files)

	timeLimiter := rate.NewLimiter(rate.Every(time.Minute), 3)
	for _, file := range files {
		var text string
		fileExt := filepath.Ext(file.Key)
		text, err = txt.GetParsedTextFromUrl(file.Url, fileExt)
		if err != nil {
			return false, err
		}

		textSections := txt.GetTextSections(text)
		for i, textSection := range textSections {
			if timeLimiter.Allow() {
				fmt.Printf("[%d/%d] Generating embedding for store: [%s]'s text section: %s\n", i+1, len(textSections), storeName, textSection)
				affected, err = addEmbeddedVector(embeddingProviderObj, textSection, storeName, file.Key, i, embeddingProviderName)
			} else {
				err = timeLimiter.Wait(context.Background())
				if err != nil {
					return false, err
				}

				fmt.Printf("[%d/%d] Generating embedding for store: [%s]'s text section: %s\n", i+1, len(textSections), storeName, textSection)
				affected, err = addEmbeddedVector(embeddingProviderObj, textSection, storeName, file.Key, i, embeddingProviderName)
			}
		}
	}

	return affected, err
}

func getRelatedVectors(owner string) ([]*Vector, error) {
	vectors, err := GetVectors(owner)
	if err != nil {
		return nil, err
	}
	if len(vectors) == 0 {
		return nil, fmt.Errorf("no knowledge vectors found")
	}

	return vectors, nil
}

func queryVectorWithContext(embeddingProvider embedding.EmbeddingProvider, text string, timeout int) ([]float32, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(30+timeout*2)*time.Second)
	defer cancel()
	return embeddingProvider.QueryVector(text, ctx)
}

func queryVectorSafe(embeddingProvider embedding.EmbeddingProvider, text string) ([]float32, error) {
	var res []float32
	var err error
	for i := 0; i < 10; i++ {
		res, err = queryVectorWithContext(embeddingProvider, text, i)
		if err != nil {
			if i > 0 {
				fmt.Printf("\tFailed (%d): %s\n", i+1, err.Error())
			}
		} else {
			break
		}
	}

	if err != nil {
		return nil, err
	} else {
		return res, nil
	}
}

func GetNearestVectorText(embeddingProvider embedding.EmbeddingProvider, owner string, text string) (string, error) {
	qVector, err := queryVectorSafe(embeddingProvider, text)
	if err != nil {
		return "", err
	}
	if qVector == nil {
		return "", fmt.Errorf("no qVector found")
	}

	searchProvider, err := GetSearchProvider("Default", owner)
	if err != nil {
		return "", err
	}

	return searchProvider.Search(qVector)
}
