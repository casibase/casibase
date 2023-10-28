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

package model

import (
	"fmt"

	"github.com/pkoukk/tiktoken-go"
)

func ReverseArray(arr []string) []string {
	for i, j := 0, len(arr)-1; i < j; i, j = i+1, j-1 {
		arr[i], arr[j] = arr[j], arr[i]
	}

	return arr
}

func GetTokenSize(model string, prompt string) (int, error) {
	tkm, err := tiktoken.EncodingForModel(model)
	if err != nil {
		return 0, err
	}

	token := tkm.Encode(prompt, nil, nil)
	res := len(token)
	return res, nil
}

func GetRecentMessagesLimitedByToken(recentMessages []string, maxTokens int) ([]string, error) {
	var res []string

	for i := 0; i < len(recentMessages); i += 2 {
		assistantMessage := recentMessages[i]
		if len(recentMessages) != 0 && i+1 >= len(recentMessages) {
			return nil, fmt.Errorf("history message length: [%d] is not even", len(recentMessages))
		}
		userMessage := recentMessages[i+1]

		assistantMessageToken, err1 := GetTokenSize("gpt-3.5-turbo", assistantMessage)
		if err1 != nil {
			return nil, err1
		}

		userMessageToken, err2 := GetTokenSize("gpt-3.5-turbo", userMessage)
		if err2 != nil {
			return nil, err2
		}

		combinedTokens := assistantMessageToken + userMessageToken
		maxTokens -= combinedTokens

		if maxTokens <= 0 {
			break
		}

		res = append(res, assistantMessage)
		res = append(res, userMessage)
	}

	return res, nil
}

func GetCurrentMessages(message string, recentMessages []string, maxTokens int) ([]string, error) {
	var res []string
	leftTokens := maxTokens

	messageToken, err := GetTokenSize("gpt-3.5-turbo", message)
	if err != nil {
		return nil, err
	}
	leftTokens -= messageToken
	if leftTokens <= 0 {
		return nil, fmt.Errorf("the token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", messageToken, "gpt-3.5-turbo", maxTokens)
	}

	limitedRecentMessages, err := GetRecentMessagesLimitedByToken(recentMessages, leftTokens)
	if err != nil {
		return nil, err
	}
	res = append(res, limitedRecentMessages...)
	res = ReverseArray(res)

	res = append(res, message)

	return res, nil
}
