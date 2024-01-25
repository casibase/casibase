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
	User   *string
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

func getSystemMessages(prompt string, knowledgeMessages []*RawMessage) []*RawMessage {
	if len(knowledgeMessages) == 0 {
		return []*RawMessage{}
	}

	if prompt == "" {
		prompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems."
	}
	res := []*RawMessage{
		{
			Text:   prompt,
			Author: "System",
		},
	}

	for i, message := range knowledgeMessages {
		res = append(
			res,
			&RawMessage{
				Text:   fmt.Sprintf("Knowledge %d: %s", i+1, message.Text),
				Author: "System",
			})
	}
	return res
}

func getHistoryMessages(recentMessages []*RawMessage, model string, leftTokens int) ([]*RawMessage, error) {
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

	res = reverseMessages(res)
	return res, nil
}

func generateMessages(prompt string, question string, recentMessages []*RawMessage, knowledgeMessages []*RawMessage, model string, maxTokens int) ([]*RawMessage, error) {
	queryMessage := &RawMessage{
		Text:   question,
		Author: openai.ChatMessageRoleUser,
	}
	queryMessageSize, err := GetTokenSize(model, queryMessage.Text)
	if err != nil {
		return nil, err
	}

	leftTokens := maxTokens - queryMessageSize
	if leftTokens <= 0 {
		return nil, fmt.Errorf("the token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]", queryMessageSize, model, maxTokens)
	}

	for i, message := range knowledgeMessages {
		messageSize, err := GetTokenSize(model, message.Text)
		if err != nil {
			return nil, err
		}

		leftTokens -= messageSize
		if leftTokens <= 0 {
			knowledgeMessages = knowledgeMessages[:i]
			break
		}
	}

	historyMessages, err := getHistoryMessages(recentMessages, model, leftTokens)
	if err != nil {
		return nil, err
	}

	res := getSystemMessages(prompt, knowledgeMessages)
	res = append(res, historyMessages...)
	res = append(res, queryMessage)
	return res, nil
}
