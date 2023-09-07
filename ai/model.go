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

package ai

import (
	"io"
	"strings"
)

type ModelProvider interface {
	QueryText(question string, writer io.Writer, builder *strings.Builder) error
}

func GetModelProvider(typ string, subType string, secretKey string) (ModelProvider, error) {
	if typ == "OpenAI API" {
		p, err := NewOpenaiGpt3p5ModelProvider(subType, secretKey)
		if err != nil {
			return nil, err
		}
		return p, nil
	}

	return nil, nil
}
