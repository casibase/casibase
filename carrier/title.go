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

package carrier

import "strings"

type TitleCarrier struct {
	divider   string
	needTitle bool
}

func NewTitleCarrier(needTitle bool) (*TitleCarrier, error) {
	return &TitleCarrier{divider: "=====", needTitle: needTitle}, nil
}

func (p *TitleCarrier) GetQuestion(question string) (string, error) {
	if !p.needTitle {
		return question, nil
	}

	format := "<title>"
	question = question +
		"  **Generate a concise and meaningful title summarizing the content of the answer.**\n\n" +
		"The title should appear at the very end of the response, prefixed by " + p.divider + "\n" +
		"Only include the title and divider if a meaningful title can be generated.\n" +
		"Format your response as: <Your answer and generated suggestion(if any)>" + p.divider + format + "\n\n"

	return question, nil
}

func (p *TitleCarrier) ParseAnswer(answer string) (string, []string, error) {
	if !p.needTitle {
		return answer, []string{""}, nil
	}

	parts := strings.Split(answer, p.divider)
	if len(parts) < 2 {
		return answer, []string{""}, nil
	}

	parsedAnswer := parts[0]
	title := strings.TrimSpace(parts[1])

	return parsedAnswer, []string{title}, nil
}
