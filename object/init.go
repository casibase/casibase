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
	"os"
	"path/filepath"

	"github.com/casibase/casibase/util"
)

const defaultPrompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems."

func InitDb() {
	initBuiltInStore()
	initBuiltInProviders()
}

func initBuiltInStore() {
	stores, err := GetGlobalStores()
	if err != nil {
		panic(err)
	}

	if len(stores) > 0 {
		return
	}

	store := &Store{
		Owner:             "admin",
		Name:              "store-built-in",
		CreatedTime:       util.GetCurrentTime(),
		DisplayName:       "Built-in Store",
		StorageProvider:   "provider-storage-built-in",
		ImageProvider:     "",
		SplitProvider:     "Default",
		ModelProvider:     "dummy-model-provider",
		EmbeddingProvider: "dummy-embedding-provider",
		MemoryLimit:       20,
		Frequency:         10000,
		LimitMinutes:      10,
		Welcome:           "Hello",
		Prompt:            defaultPrompt,
		ThemeColor:        "#5734d3",
		PropertiesMap:     map[string]*Properties{},
	}
	_, err = AddStore(store)
	if err != nil {
		panic(err)
	}
}

func getDefaultStoragePath(storeName string) (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	res := filepath.Join(cwd, "files", storeName)
	return res, nil
}

func initBuiltInProviders() {
	storageProvider, err := GetDefaultStorageProvider()
	if err != nil {
		panic(err)
	}

	modelProvider, err := GetDefaultModelProvider()
	if err != nil {
		panic(err)
	}

	embeddingProvider, err := GetDefaultEmbeddingProvider()
	if err != nil {
		panic(err)
	}

	if storageProvider == nil {
		var path string
		path, err = getDefaultStoragePath("store-built-in")
		if err != nil {
			panic(err)
		}

		util.EnsureFileFolderExists(path)

		storageProvider = &Provider{
			Owner:       "admin",
			Name:        "provider-storage-built-in",
			CreatedTime: util.GetCurrentTime(),
			DisplayName: "Built-in Storage Provider",
			Category:    "Storage",
			Type:        "Local File System",
			ClientId:    path,
		}
		_, err = AddProvider(storageProvider)
		if err != nil {
			panic(err)
		}
	}

	if modelProvider == nil {
		modelProvider = &Provider{
			Owner:       "admin",
			Name:        "dummy-model-provider",
			CreatedTime: util.GetCurrentTime(),
			DisplayName: "Dummy Model Provider",
			Category:    "Model",
			Type:        "Dummy",
			SubType:     "Dummy",
		}
		_, err = AddProvider(modelProvider)
		if err != nil {
			panic(err)
		}
	}

	if embeddingProvider == nil {
		embeddingProvider = &Provider{
			Owner:       "admin",
			Name:        "dummy-embedding-provider",
			CreatedTime: util.GetCurrentTime(),
			DisplayName: "Dummy Embedding Provider",
			Category:    "Embedding",
			Type:        "Dummy",
			SubType:     "Dummy",
		}
		_, err = AddProvider(embeddingProvider)
		if err != nil {
			panic(err)
		}
	}
}
