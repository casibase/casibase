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

package split

import "strings"

type DefaultSplitProvider struct{}

func NewDefaultSplitProvider() (*DefaultSplitProvider, error) {
	return &DefaultSplitProvider{}, nil
}

func (p *DefaultSplitProvider) SplitText(text string) ([]string, error) {
	const maxLength = 210 * 3
	var res []string
	var tempLines []string

	lines := strings.Split(text, "\n")
	for _, line := range lines {
		if len(strings.Join(tempLines, "\n"))+len(line) <= maxLength {
			tempLines = append(tempLines, line)
		} else {
			if len(tempLines) > 0 {
				res = append(res, strings.Join(tempLines, "\n"))
			}
			tempLines = []string{line}
		}
	}

	if len(tempLines) > 0 {
		res = append(res, strings.Join(tempLines, "\n"))
	}

	return res, nil
}
