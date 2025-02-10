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

package split

import (
	"regexp"
	"strings"

	"github.com/casibase/casibase/model"
)

type DefaultSplitProvider struct{}

func NewDefaultSplitProvider() (*DefaultSplitProvider, error) {
	return &DefaultSplitProvider{}, nil
}

func (p *DefaultSplitProvider) SplitText(text string) ([]string, error) {
	const maxLength = 210
	sections := []string{}
	var currentSection strings.Builder
	var codeBlock strings.Builder
	inCodeBlock := false
	codeBlockLines := 0

	lines := strings.Split(text, "\n")
	emptyLineCount := 0

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if line == "" {
			emptyLineCount++
			if emptyLineCount >= 4 && currentSection.Len() > 0 {
				sections = append(sections, currentSection.String())
				currentSection.Reset()
			}
			continue
		} else {
			emptyLineCount = 0
		}

		if line == "```" {
			if inCodeBlock {
				inCodeBlock = false
				if codeBlockLines >= 5 {
					if currentSection.Len() > 0 {
						sections = append(sections, currentSection.String())
						currentSection.Reset()
					}
					sections = append(sections, codeBlock.String())
				} else {
					currentSection.WriteString(codeBlock.String())
				}
				codeBlock.Reset()
				codeBlockLines = 0
			} else {
				inCodeBlock = true
			}
			continue
		}

		if inCodeBlock {
			codeBlock.WriteString(line + "\n")
			codeBlockLines++
			if codeBlockLines >= 20 {
				if currentSection.Len() > 0 {
					sections = append(sections, currentSection.String())
					currentSection.Reset()
				}
				sections = append(sections, codeBlock.String())
				codeBlock.Reset()
				codeBlockLines = 0
			}
			continue
		}

		if isSectionSeparator(line) {
			if currentSection.Len() > 0 {
				sections = append(sections, currentSection.String())
				currentSection.Reset()
			}
			currentSection.WriteString(line + "\n")
			continue
		}

		tokenSize, err := model.GetTokenSize("gpt-3.5-turbo", currentSection.String()+line)
		if err != nil {
			return nil, err
		}

		if tokenSize <= maxLength {
			if currentSection.Len() > 0 {
				currentSection.WriteString("\n")
			}
			currentSection.WriteString(line)
		} else {
			if currentSection.Len() > 0 {
				sections = append(sections, currentSection.String())
				currentSection.Reset()
			}
			currentSection.WriteString(line)
		}
	}

	if currentSection.Len() > 0 {
		sections = append(sections, currentSection.String())
	}

	return sections, nil
}

func isSectionSeparator(line string) bool {
	// Check for chapter or section titles
	if strings.HasPrefix(line, "Chapter") || strings.HasPrefix(line, "Section") {
		return true
	}
	// Check for numeric bullet points (e.g., "1. ", "2. ")
	matched, _ := regexp.MatchString(`^\d+\.\s`, line)
	return matched
}
