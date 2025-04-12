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

package controllers

import (
	"github.com/casibase/casibase/carrier"
	"github.com/casibase/casibase/object"
)

func getQuestionWithCarriers(question string, suggestionCount int) (string, error) {
	suggestionCarrier, err := carrier.NewSuggestionCarrier(suggestionCount)
	if err != nil {
		return "", err
	}

	var res string
	res, err = suggestionCarrier.GetQuestion(question)
	return res, err
}

func parseAnswerWithCarriers(answer string, suggestionCount int) (string, []object.Suggestion, error) {
	suggestionCarrier, err := carrier.NewSuggestionCarrier(suggestionCount)
	if err != nil {
		return "", nil, err
	}

	parsedAnswer, suggestionTexts, err := suggestionCarrier.ParseAnswer(answer)
	if err != nil {
		return "", nil, err
	}

	suggestions := []object.Suggestion{}
	for _, suggestionText := range suggestionTexts {
		suggestions = append(suggestions, object.Suggestion{Text: suggestionText, IsHit: false})
	}

	return parsedAnswer, suggestions, nil
}
