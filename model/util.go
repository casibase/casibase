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
	"math"
	"regexp"

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

func getPrice(tokenCount int, pricePerThousandTokens float64) float64 {
	res := (float64(tokenCount) / 1000.0) * pricePerThousandTokens
	res = math.Round(res*1e8) / 1e8
	return res
}

func AddPrices(price1 float64, price2 float64) float64 {
	res := price1 + price2
	res = math.Round(res*1e8) / 1e8
	return res
}

func RefinePrice(price float64) float64 {
	res := math.Round(price*1e2) / 1e2
	return res
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

func getDefaultModelResult(modelSubType string, prompt string, response string) (*ModelResult, error) {
	modelResult := &ModelResult{}

	promptTokenCount, err := GetTokenSize(modelSubType, prompt)
	if err != nil {
		promptTokenCount, err = GetTokenSize("gpt-3.5-turbo", prompt)
	}
	if err != nil {
		return nil, err
	}

	responseTokenCount, err := GetTokenSize(modelSubType, response)
	if err != nil {
		responseTokenCount, err = GetTokenSize("gpt-3.5-turbo", response)
	}
	if err != nil {
		return nil, err
	}

	modelResult.PromptTokenCount = promptTokenCount
	modelResult.ResponseTokenCount = responseTokenCount
	modelResult.TotalTokenCount = promptTokenCount + responseTokenCount
	modelResult.Currency = "USD"
	return modelResult, nil
}

func getSystemMessages(prompt string, knowledgeMessages []*RawMessage) []*RawMessage {
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

func OpenaiGenerateMessages(prompt string, question string, recentMessages []*RawMessage, knowledgeMessages []*RawMessage, model string, maxTokens int) ([]*RawMessage, error) {
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
	nonImageHistoryMessage := []*RawMessage{}
	for _, message := range historyMessages {
		re := regexp.MustCompile(`<img[^>]*\s+src=["']?([^"'>\s]+)["']?[^>]*>`)
		match := re.FindStringSubmatch(message.Text)
		if match == nil {
			nonImageHistoryMessage = append(nonImageHistoryMessage, message)
		}
	}

	res := getSystemMessages(prompt, knowledgeMessages)
	res = append(res, nonImageHistoryMessage...)
	res = append(res, queryMessage)
	return res, nil
}
