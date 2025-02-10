// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

package model

import (
	"io"
	"strings"
)

type DummyModelProvider struct {
	subType string
}

func NewDummyModelProvider(subType string) (*DummyModelProvider, error) {
	return &DummyModelProvider{
		subType: subType,
	}, nil
}

func (c *DummyModelProvider) GetPricing() string {
	return `URL:
This is a dummy module provider.

Generate Model:

This is a dummy module provider.
`
}

func (p *DummyModelProvider) QueryText(message string, writer io.Writer, chat_history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	answer := "this is the answer for \"" + message + "\""
	if strings.HasPrefix(message, "$CasibaseDryRun$") {
		return &ModelResult{}, nil
	}
	err := flushDataAzure(answer, writer)
	if err != nil {
		return nil, err
	}
	return &ModelResult{}, nil
}
