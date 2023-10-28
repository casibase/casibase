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

import "github.com/sashabaranov/go-openai"

// https://pkg.go.dev/github.com/sashabaranov/go-openai@v1.12.0#pkg-constants
// https://platform.openai.com/docs/models/overview
var __maxTokens = map[string]int{
	openai.GPT4:                 8192,
	openai.GPT40613:             8192,
	openai.GPT432K:              32768,
	openai.GPT432K0613:          32768,
	openai.GPT40314:             8192,
	openai.GPT432K0314:          32768,
	openai.GPT3Dot5Turbo:        4097,
	openai.GPT3Dot5Turbo16K:     16385,
	openai.GPT3Dot5Turbo0613:    4097,
	openai.GPT3Dot5Turbo16K0613: 16385,
	openai.GPT3Dot5Turbo0301:    4097,
	openai.GPT3TextDavinci003:   4097,
	openai.GPT3TextDavinci002:   4097,
	openai.GPT3TextCurie001:     2049,
	openai.GPT3TextBabbage001:   2049,
	openai.GPT3TextAda001:       2049,
	openai.GPT3Davinci:          2049,
	openai.GPT3Curie:            2049,
	openai.GPT3Ada:              2049,
	openai.GPT3Babbage:          2049,
}

// getOpenAiMaxTokens returns the max tokens for a given OpenAI model.
func getOpenAiMaxTokens(model string) int {
	res, ok := __maxTokens[model]
	if !ok {
		return 4097
	}
	return res
}

func getOpenAiModelType(model string) string {
	chatModels := []string{
		"gpt-4-32k-0613", "gpt-4-32k-0314", "gpt-4-32k",
		"gpt-4-0613", "gpt-4-0314", "gpt-4", "gpt-3.5-turbo-0613",
		"gpt-3.5-turbo-0301", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-0613",
		"gpt-3.5-turbo",
	}

	completionModels := []string{
		"text-davinci-003", "text-davinci-002", "text-curie-001",
		"text-babbage-001", "text-ada-001", "text-davinci-001",
		"davinci-instruct-beta", "davinci", "curie-instruct-beta", "curie", "ada", "babbage",
	}

	for _, chatModel := range chatModels {
		if model == chatModel {
			return "Chat"
		}
	}

	for _, completionModel := range completionModels {
		if model == completionModel {
			return "Completion"
		}
	}

	return "Unknown"
}

func rawMessagesToOpenAiMessages(messages []*RawMessage) []openai.ChatCompletionMessage {
	res := []openai.ChatCompletionMessage{}
	for _, message := range messages {
		var role string
		if message.Author == "AI" {
			role = openai.ChatMessageRoleAssistant
		} else if message.Author == "System" {
			role = openai.ChatMessageRoleSystem
		} else {
			role = openai.ChatMessageRoleUser
		}

		item := openai.ChatCompletionMessage{
			Role:    role,
			Content: message.Text,
		}
		res = append(res, item)
	}
	return res
}
