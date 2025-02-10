// Copyright 2024 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package split

import "strings"

// QaSplitProvider structure
type QaSplitProvider struct{}

// NewQaSplitProvider creates a new instance of QaSplitProvider
func NewQaSplitProvider() (*QaSplitProvider, error) {
	return &QaSplitProvider{}, nil
}

// SplitText method splits the text into question-answer pairs
func (p *QaSplitProvider) SplitText(text string) ([]string, error) {
	res := []string{}
	var currentPair string
	var collectingAnswer bool

	// Split the text by lines
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "Q:") {
			if currentPair != "" {
				// Save the previous question-answer pair
				res = append(res, currentPair)
			}
			currentPair = line
			collectingAnswer = false
		} else if strings.HasPrefix(line, "A:") {
			currentPair += "\n" + line
			collectingAnswer = true
		} else if collectingAnswer {
			currentPair += "\n" + line
		}
	}

	// Add the last question-answer pair
	if currentPair != "" {
		res = append(res, currentPair)
	}

	return res, nil
}
