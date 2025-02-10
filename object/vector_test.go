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

package object

import (
	"testing"

	"github.com/casibase/casibase/model"
)

func TestUpdateVectors(t *testing.T) {
	InitConfig()

	vectors, err := GetGlobalVectors()
	if err != nil {
		panic(err)
	}

	for _, vector := range vectors {
		if vector.Text != "" && (vector.TokenCount == 0 || vector.Price == 0) {
			vector.TokenCount, err = model.GetTokenSize("text-davinci-003", vector.Text)
			if err != nil {
				panic(err)
			}

			_, err = UpdateVector(vector.GetId(), vector)
			if err != nil {
				panic(err)
			}
		}
	}
}
