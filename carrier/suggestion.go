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

import (
	"fmt"
	"strconv"
	"strings"
)

type SuggestionCarrier struct {
	divider         string
	suggestionCount int
}

func NewSuggestionCarrier(suggestionCount int) (*SuggestionCarrier, error) {
	return &SuggestionCarrier{divider: "|||", suggestionCount: suggestionCount}, nil
}

func (p *SuggestionCarrier) GetQuestion(question string) (string, error) {
	if p.suggestionCount <= 0 {
		return question, nil
	}

	format := "<Your answer>"
	for i := 0; i < p.suggestionCount; i++ {
		format += p.divider + "<Predicted question " + strconv.Itoa(i+1) + ">"
	}

	promptTemplate := `Please follow the steps below to optimize your answer:

1. **Generate an answer**: Provide a clear, accurate, and helpful answer to the user's question.

2. **Predict possible follow-up questions from the user**: Based on the current question and answer, think and predict three questions that the user might ask further.

3. **Format the answer and predicted questions**: Use a specific format to connect the answer and the predicted questions. The format is as follows:
   - Follow the answer with a separator "%s"
   - Then there are the predicted %d questions, each separated by "%s", do not add any other symbols.

Your answer should be replied in the following format: %s

The '<>' is to tell you to put something in here, your answer does not need to include '<>'.
The language of suggestions should be the same as the language of answer
Every Predicted question should end with a question mark '?'.

Please note, the separator for each part is "%s", make sure not to use this separator in the answer or question.

Examples of generated predicted questions:
1. Do you know the weather today?
2. Do you have any news to share?

Here is the user's question: %s`

	question = fmt.Sprintf(promptTemplate, p.divider, p.suggestionCount, p.divider, format, p.divider, question)

	return question, nil
}

func formatSuggestion(suggestionText string) string {
	suggestionText = strings.TrimSpace(suggestionText)
	suggestionText = strings.TrimPrefix(suggestionText, "<")
	suggestionText = strings.TrimSuffix(suggestionText, `>`)
	if !(strings.HasSuffix(suggestionText, "?") || strings.HasSuffix(suggestionText, "？")) {
		suggestionText += "?"
	}
	return suggestionText
}

func (p *SuggestionCarrier) ParseAnswer(answer string) (string, []string, error) {
	if p.suggestionCount <= 0 {
		return answer, []string{}, nil
	}

	parts := strings.Split(answer, p.divider)

	suggestions := []string{}
	if len(parts) < 2 {
		return answer, suggestions, nil
	}

	parsedAnswer := parts[0]
	for i := 1; i < len(parts); i++ {
		suggestions = append(suggestions, formatSuggestion(parts[i]))
	}
	return parsedAnswer, suggestions, nil
}
