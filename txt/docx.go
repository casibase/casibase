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

package txt

import (
	"fmt"
	"strings"

	"github.com/carmel/gooxml/document"
)

func GetTextFromDocx(path string) (string, error) {
	if markitdownExists {
		return GetTextFromMarkitdown(path)
	}

	docx, err := document.Open(path)
	if err != nil {
		return "", err
	}

	paragraphs := []string{}
	for _, para := range docx.Paragraphs() {
		var paraText string

		for _, run := range para.Runs() {
			paraText += run.Text()
		}

		if len(para.Runs()) > 1 {
			paragraphs = append(paragraphs, paraText+"\n\n")
		} else {
			paragraphs = append(paragraphs, paraText+"\n")
		}
	}

	if len(paragraphs) == 0 {
		return "", fmt.Errorf(".docx file is empty")
	}

	text := strings.Join(paragraphs, "")
	return text, nil
}
