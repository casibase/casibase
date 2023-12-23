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
	"runtime"

	"github.com/casibase/casibase/util"
)

const defaultPrompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems."

func InitDb() {
	initBuiltInStore()
	initBuiltInProvider()
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
		SplitProvider:     "Default",
		ModelProvider:     "",
		EmbeddingProvider: "",
		MemoryLimit:       20,
		Frequency:         10000,
		LimitMinutes:      10,
		Welcome:           "Hello",
		Prompt:            defaultPrompt,
		PropertiesMap:     map[string]*Properties{},
	}
	_, err = AddStore(store)
	if err != nil {
		panic(err)
	}
}

func initBuiltInProvider() {
	provider, err := GetDefaultStorageProvider()
	if err != nil {
		panic(err)
	}

	if provider != nil {
		return
	}

	path := "/storage_casibase"
	if runtime.GOOS == "windows" {
		path = "C:/storage_casibase"
	}

	provider = &Provider{
		Owner:       "admin",
		Name:        "provider-storage-built-in",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "Built-in Storage Provider",
		Category:    "Storage",
		Type:        "Local File System",
		ClientId:    path,
	}
	_, err = AddProvider(provider)
	if err != nil {
		panic(err)
	}
}
