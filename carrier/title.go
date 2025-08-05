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
		"\n\n**At the end of your answer, if and only if a clear, concise, and meaningful topic title can be generated — based on both the user's input and your response — then append it.**\n" +
		"A meaningful topic title should be able to represent the user's purpose or the overall theme of this conversation.\n" +
		"Examples of generated title:\n" +
		"\tquery: what is casibase? title: introduction to casibase\n" +
		"It should appear at the very end of the response, prefixed by: " + p.divider + "\n" +
		"Do not include the divider or title if a meaningful title cannot be generated.\n" +
		"Format:\n<Your complete answer>\n" + p.divider + format + "\n"

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
