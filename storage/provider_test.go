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

//go:build !skipCi
// +build !skipCi

package storage_test

import (
	"fmt"
	"testing"

	"github.com/casibase/casibase/controllers"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/storage"
)

func TestStorage(t *testing.T) {
	object.InitConfig()
	controllers.InitAuthConfig()

	provider := "provider_storage_casibase"
	providerObj, err := storage.NewCasdoorProvider(provider, "en")
	objects, err := providerObj.ListObjects("")
	if err != nil {
		panic(err)
	}

	for i, obj := range objects {
		fmt.Printf("[%d] %v\n", i, obj)
	}
}
