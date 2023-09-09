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

	"github.com/casbin/casibase/model"
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

func getFilteredFileObjects(provider string, prefix string) ([]*storage.Object, error) {
	files, err := storage.ListObjects(provider, prefix)
	if err != nil {
		return nil, err
	}

	return filterTextFiles(files), nil
}

func addEmbeddedVector(authToken string, text string, storeName string, fileName string) (bool, error) {
	embedding, err := model.GetEmbeddingSafe(authToken, text)
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
		File:        fileName,
		Text:        text,
		Data:        embedding,
	}
	return AddVector(vector)
}

func addVectorsForStore(authToken string, provider string, key string, storeName string) (bool, error) {
	var affected bool
	var err error

	objs, err := getFilteredFileObjects(provider, key)
	if err != nil {
		return false, err
	}

	timeLimiter := rate.NewLimiter(rate.Every(time.Minute), 3)
	for _, obj := range objs {
		var text string
		fileExt := filepath.Ext(obj.Key)
		text, err = txt.GetParsedTextFromUrl(obj.Url, fileExt)
		if err != nil {
			return false, err
		}

		textSections := txt.GetTextSections(text)
		for i, textSection := range textSections {
			if timeLimiter.Allow() {
				fmt.Printf("[%d/%d] Generating embedding for store: [%s]'s text section: %s\n", i+1, len(textSections), storeName, textSection)
				affected, err = addEmbeddedVector(authToken, textSection, storeName, obj.Key)
			} else {
				err = timeLimiter.Wait(context.Background())
				if err != nil {
					return false, err
				}

				fmt.Printf("[%d/%d] Generating embedding for store: [%s]'s text section: %s\n", i+1, len(textSections), storeName, textSection)
				affected, err = addEmbeddedVector(authToken, textSection, storeName, obj.Key)
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

func GetNearestVectorText(authToken string, owner string, question string) (string, error) {
	qVector, err := model.GetEmbeddingSafe(authToken, question)
	if err != nil {
		return "", err
	}
	if qVector == nil {
		return "", fmt.Errorf("no qVector found")
	}

	vectors, err := getRelatedVectors(owner)
	if err != nil {
		return "", err
	}

	var nVectors [][]float32
	for _, candidate := range vectors {
		nVectors = append(nVectors, candidate.Data)
	}

	i := model.GetNearestVectorIndex(qVector, nVectors)
	return vectors[i].Text, nil
}
