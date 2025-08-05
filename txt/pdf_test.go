// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package txt

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParsePdfIntoTxt(t *testing.T) {
	err := filepath.Walk(pdfDirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			panic(err)
			return nil
		}

		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".pdf") {
			relPath, _ := filepath.Rel(pdfDirPath, path)

			parts := strings.Split(relPath, string(filepath.Separator))
			if len(parts) < 2 {
				return nil
			}
			number := parts[0]

			err = processPdf(path, number)
			if err != nil {
				fmt.Println("Error processing:", path, "->", err)
			}
		}

		return nil
	})
	if err != nil {
		panic(err)
	}
}
