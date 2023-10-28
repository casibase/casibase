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
	"github.com/sashabaranov/go-openai"
)

type RawMessage struct {
	Text   string
	Author string
}

func reverseMessages(arr []*RawMessage) []*RawMessage {
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

func GetKnowledgeFromRawMessages(systemPrompt string, rawMessages []*RawMessage) []*RawMessage {
	if systemPrompt == "" {
		systemPrompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems."
	}
	res := []*RawMessage{
		{
			Text:   systemPrompt,
			Author: "System",
		},
	}
	for i, rawMessage := range rawMessages {
		res = append(
			res,
			&RawMessage{
				Text:   fmt.Sprintf("Knowledge %d: %s", i+1, rawMessage.Text),
				Author: "System",
			})
	}

	return res
}

func getRecentMessagesLimitedByToken(recentMessages []*RawMessage, model string, leftTokens int) ([]*RawMessage, error) {
	var res []*RawMessage

	for _, message := range recentMessages {
		messageTokenSize, err := GetTokenSize(model, message.Text)
		if err != nil {
			return nil, err
		}

		leftTokens -= messageTokenSize
		if leftTokens <= 0 {
			break
		}

		res = append(res, message)
	}
	return res, nil
}

func getLimitedMessages(systemPrompt string, question string, recentMessages []*RawMessage, knowledge []*RawMessage, model string, maxTokens int) ([]*RawMessage, error) {
	query := &RawMessage{
		Text:   question,
		Author: openai.ChatMessageRoleUser,
	}
	leftTokens := maxTokens

	for i, message := range append([]*RawMessage{query}, knowledge...) {
		messageTokenSize, err := GetTokenSize(model, message.Text)
		if err != nil {
			return nil, err
		}
		leftTokens -= messageTokenSize
		if message.Author == "User" && leftTokens <= 0 {
			return nil, fmt.Errorf("the token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", messageTokenSize, model, maxTokens)
		} else if message.Author == "System" && leftTokens <= 0 {
			knowledge = knowledge[:i-1]
			break
		}
	}

	limitedRecentMessages, err := getRecentMessagesLimitedByToken(recentMessages, model, leftTokens)
	if err != nil {
		return nil, err
	}
	res := reverseMessages(limitedRecentMessages)
	if len(knowledge) != 0 {
		systemMessage := GetKnowledgeFromRawMessages(systemPrompt, knowledge)
		res = append(systemMessage, res...)
	}
	res = append(res, query)
	return res, nil
}
