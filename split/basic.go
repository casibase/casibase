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

package split

import (
	"strings"

	"github.com/casibase/casibase/model"
)

type BasicSplitProvider struct{}

func NewBasicSplitProvider() (*BasicSplitProvider, error) {
	return &BasicSplitProvider{}, nil
}

func (p *BasicSplitProvider) SplitText(text string) ([]string, error) {
	const maxLength = 210
	res := []string{}
	var temp string

	lines := strings.Split(text, "\n")
	for _, line := range lines {
		tokenSize, err := model.GetTokenSize("gpt-3.5-turbo", temp+line)
		if err != nil {
			return nil, err
		}

		if tokenSize <= maxLength {
			if temp != "" {
				temp += "\n"
			}
			temp += line
		} else {
			if temp != "" {
				res = append(res, temp)
			}
			temp = line
		}
	}

	if temp != "" {
		if len(temp) < 300 && len(res) > 0 {
			res[len(res)-1] += temp
		} else {
			res = append(res, temp)
		}
	}

	return res, nil
}
