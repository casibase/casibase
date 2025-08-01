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
	"fmt"
	"strings"
	"sync"

	"github.com/casibase/casibase/carrier"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
)

func getQuestionWithCarriers(question string, suggestionCount int, needTitle bool) (string, error) {
	carriedQuestion := question

	suggestionCarrier, err := carrier.NewSuggestionCarrier(suggestionCount)
	if err != nil {
		return "", err
	}

	carriedQuestion, err = suggestionCarrier.GetQuestion(carriedQuestion)

	titleCarrier, err := carrier.NewTitleCarrier(needTitle)
	if err != nil {
		return "", err
	}

	carriedQuestion, err = titleCarrier.GetQuestion(carriedQuestion)
	if err != nil {
		return "", err
	}

	return carriedQuestion, err
}

func parseAnswerWithCarriers(answer string, suggestionCount int, needTitle bool) (string, []object.Suggestion, string, error) {
	suggestionCarrier, err := carrier.NewSuggestionCarrier(suggestionCount)
	if err != nil {
		return "", nil, "", err
	}

	titleCarrier, err := carrier.NewTitleCarrier(needTitle)
	if err != nil {
		return "", nil, "", err
	}

	parsedAnswer, textArray, err := titleCarrier.ParseAnswer(answer)
	if err != nil {
		return "", nil, "", err
	}

	title := textArray[0]

	parsedAnswer, textArray, err = suggestionCarrier.ParseAnswer(parsedAnswer)
	if err != nil {
		return "", nil, "", err
	}

	suggestions := []object.Suggestion{}
	for _, suggestionText := range textArray {
		suggestions = append(suggestions, object.Suggestion{Text: suggestionText, IsHit: false})
	}

	return parsedAnswer, suggestions, title, nil
}

func isReasonModel(typ string) bool {
	typ = strings.ToLower(typ)
	if strings.Contains(typ, "r1") {
		return true
	} else if strings.Contains(typ, "reasoner") {
		return true
	}
	return false
}

func getResultWithSuggestionsAndTitle(writer *CarrierWriter, question string, modelProviderObj model.ModelProvider, needTitle bool, suggestionCount int) (*model.ModelResult, error) {
	var fullPrompt strings.Builder

	fullPrompt.WriteString(fmt.Sprintf("User question: %s\n\n", question))
	if suggestionCount > 0 {
		divider := "|||"
		suggestionPrompt := fmt.Sprintf(`**Based on the user question, generate %d possible follow-up questions. No need to answer user question. 
They must:
- Be in the same language as the original question.
- Start with the separator "%s".
- Be separated by "%s" without any other formatting or explanation.
- Do not include any explanation, analysis, or answers—only output the %d questions.

`, suggestionCount, divider, divider, suggestionCount)
		fullPrompt.WriteString(suggestionPrompt)
	}
	if needTitle {
		fullPrompt.WriteString(`
**Finally, generate a concise and meaningful title for the original question. No need to answer user question. 
A meaningful topic title should be able to represent the user's purpose or the overall theme of this conversation.
Examples of generated title:
	query: what is casibase? title: introduction to casibase
- The title must start with "=====" (five equals signs, no space).
- Do not include the divider or title if a meaningful title cannot be generated.
- Do NOT include any explanations or extra text—just output the title.`)
	}

	carrierResult, err := modelProviderObj.QueryText(fullPrompt.String(), writer, nil, "", nil, nil)
	if err != nil {
		return nil, err
	}

	return carrierResult, nil
}

func QueryCarrierText(question string, writer *RefinedWriter, history []*model.RawMessage, prompt string, knowledge []*model.RawMessage, modelProviderObj model.ModelProvider, needTitle bool, suggestionCount int) (*model.ModelResult, error) {
	var (
		wg         sync.WaitGroup
		mainErr    error
		carrierErr error
	)

	var modelResult *model.ModelResult

	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		modelResult, err = modelProviderObj.QueryText(question, writer, history, prompt, knowledge, nil)
		if err != nil {
			mainErr = err
		}
	}()

	CarrierWriter := &CarrierWriter{*NewCleaner(6), []byte{}}
	var carrierResult *model.ModelResult

	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		carrierResult, err = getResultWithSuggestionsAndTitle(CarrierWriter, question, modelProviderObj, needTitle, suggestionCount)
		if err != nil {
			carrierErr = err
		}
	}()

	wg.Wait()

	if mainErr != nil {
		return nil, mainErr
	}
	if carrierErr != nil {
		return nil, carrierErr
	}

	modelResult.PromptTokenCount += carrierResult.PromptTokenCount
	modelResult.ResponseTokenCount += carrierResult.ResponseTokenCount
	modelResult.TotalPrice += carrierResult.TotalPrice
	modelResult.TotalTokenCount += carrierResult.TotalTokenCount

	writer.Write(CarrierWriter.messageBuf)

	return modelResult, nil
}
