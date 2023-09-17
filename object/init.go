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

import "github.com/casbin/casibase/util"

func InitDb() {
	existed := initBuiltInStore()
	if !existed {
		initBuiltInProvider()
	}
}

func initBuiltInStore() bool {
	store, err := getStore("admin", "built-in")
	if err != nil {
		panic(err)
	}

	if store != nil {
		return true
	}

	store = &Store{
		Owner:             "admin",
		Name:              "store-default",
		CreatedTime:       util.GetCurrentTime(),
		DisplayName:       "Data Store - Default",
		StorageProvider:   "",
		ModelProvider:     "",
		EmbeddingProvider: "",
	}
	_, err = AddStore(store)
	if err != nil {
		panic(err)
	}

	return false
}

func initBuiltInProvider() {
	provider, err := GetProvider(util.GetId("admin", "provider_captcha_default"))
	if err != nil {
		panic(err)
	}

	if provider != nil {
		return
	}

	provider = &Provider{
		Owner:       "admin",
		Name:        "provider_captcha_default",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "Captcha Default",
		Category:    "Captcha",
		Type:        "Default",
	}
	_, err = AddProvider(provider)
	if err != nil {
		panic(err)
	}
}
