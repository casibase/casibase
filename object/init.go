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
	"os"
	"path/filepath"

	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/util"
)

func InitDb() {
	modelProviderName, embeddingProviderName, ttsProviderName, sttProviderName := initBuiltInProviders()
	initBuiltInStore(modelProviderName, embeddingProviderName, ttsProviderName, sttProviderName)
}

func initBuiltInStore(modelProviderName string, embeddingProviderName string, ttsProviderName string, sttProviderName string) {
	stores, err := GetGlobalStores()
	if err != nil {
		panic(err)
	}

	if len(stores) > 0 {
		return
	}

	imageProviderName := ""
	providerDbName := conf.GetConfigString("providerDbName")
	if providerDbName != "" {
		imageProviderName = "provider_storage_casibase_default"
	}

	store := &Store{
		Owner:                "admin",
		Name:                 "store-built-in",
		CreatedTime:          util.GetCurrentTime(),
		DisplayName:          "Built-in Store",
		Title:                "AI Assistant",
		Avatar:               "https://cdn.casibase.com/static/favicon.png",
		StorageProvider:      "provider-storage-built-in",
		ImageProvider:        imageProviderName,
		SplitProvider:        "Default",
		ModelProvider:        modelProviderName,
		EmbeddingProvider:    embeddingProviderName,
		AgentProvider:        "",
		TextToSpeechProvider: ttsProviderName,
		SpeechToTextProvider: sttProviderName,
		Frequency:            10000,
		MemoryLimit:          10,
		LimitMinutes:         15,
		Welcome:              "Hello",
		WelcomeTitle:         "Hello, this is the Casibase AI Assistant",
		WelcomeText:          "I'm here to help answer your questions",
		Prompt:               "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems.",
		Prompts:              []Prompt{},
		KnowledgeCount:       5,
		SuggestionCount:      3,
		ThemeColor:           "#5734d3",
		ChildStores:          []string{},
		ChildModelProviders:  []string{},
		IsDefault:            true,
		State:                "Active",
		PropertiesMap:        map[string]*Properties{},
	}

	if providerDbName != "" {
		store.ShowAutoRead = true
		store.DisableFileUpload = true

		tokens := conf.ReadGlobalConfigTokens()
		if len(tokens) > 0 {
			store.Title = tokens[0]
			store.Avatar = tokens[1]
			store.Welcome = tokens[2]
			store.WelcomeTitle = tokens[3]
			store.WelcomeText = tokens[4]
			store.Prompt = tokens[5]
		}
	}

	_, err = AddStore(store)
	if err != nil {
		panic(err)
	}
}

func getDefaultStoragePath(storeName string) (string, error) {
	providerDbName := conf.GetConfigString("providerDbName")
	if providerDbName != "" {
		dbName := conf.GetConfigString("dbName")
		return fmt.Sprintf("C:/casibase_data/%s/%s", dbName, storeName), nil
	}

	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	res := filepath.Join(cwd, "files", storeName)
	return res, nil
}

func initBuiltInProviders() (string, string, string, string) {
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

	ttsProvider, err := GetDefaultTextToSpeechProvider()
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

	ttsProviderName := "Browser Built-In"
	if ttsProvider != nil {
		ttsProviderName = ttsProvider.Name
	}

	sttProviderName := "Browser Built-In"

	return modelProvider.Name, embeddingProvider.Name, ttsProviderName, sttProviderName
}
