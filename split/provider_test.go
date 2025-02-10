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

package split_test

import (
	"fmt"
	"path/filepath"
	"testing"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/split"
	"github.com/casibase/casibase/txt"
	"github.com/casibase/casibase/util"
)

func TestSplit(t *testing.T) {
	object.InitConfig()

	p, err := split.GetSplitProvider("Default")
	if err != nil {
		panic(err)
	}

	storageProvider, err := object.GetProvider("admin/provider-storage-built-in")
	if err != nil {
		panic(err)
	}

	path := filepath.Join(storageProvider.ClientId, "test.md")
	text := util.ReadStringFromPath(path)
	textSections, err := p.SplitText(text)
	if err != nil {
		panic(err)
	}

	for i, s := range textSections {
		fmt.Printf("[%d] %s\n\n", i, s)
	}
}

func TestSplit2(t *testing.T) {
	object.InitConfig()

	p, err := split.GetSplitProvider("QA")
	if err != nil {
		panic(err)
	}

	storageProvider, err := object.GetProvider("admin/provider-storage-built-in")
	if err != nil {
		panic(err)
	}

	path := filepath.Join(storageProvider.ClientId, "QAText.docx")

	text, err := txt.GetParsedTextFromUrl(path, ".docx")
	if err != nil {
		panic(err)
	}

	textSections, err := p.SplitText(text)
	if err != nil {
		panic(err)
	}

	for i, s := range textSections {
		fmt.Printf("[%d] %s\n\n", i, s)
	}
}

func TestSplit3(t *testing.T) {
	object.InitConfig()

	p, err := split.GetSplitProvider("Default")
	if err != nil {
		panic(err)
	}

	storageProvider, err := object.GetProvider("admin/storage-built")
	if err != nil {
		panic(err)
	}

	path := filepath.Join(storageProvider.ClientId, "myfile.docx")

	text, err := txt.GetParsedTextFromUrl(path, ".docx")
	if err != nil {
		panic(err)
	}

	textSections, err := p.SplitText(text)
	if err != nil {
		panic(err)
	}

	for i, s := range textSections {
		fmt.Printf("[%d] %s\n\n", i, s)
	}
}
