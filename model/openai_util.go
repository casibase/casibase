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
	"strings"

	"github.com/pkoukk/tiktoken-go"
	"github.com/sashabaranov/go-openai"
)

// https://pkg.go.dev/github.com/sashabaranov/go-openai@v1.12.0#pkg-constants
// https://platform.openai.com/docs/models/overview
var __maxTokens = map[string]int{
	openai.GPT4VisionPreview:    128000,
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

// GetOpenAiMaxTokens returns the max tokens for a given OpenAI model.
func GetOpenAiMaxTokens(model string) int {
	res, ok := __maxTokens[model]
	if !ok {
		return 4097
	}
	return res
}

func getOpenAiModelType(model string) string {
	chatModels := []string{
		"dall-e-3", "gpt-4-vision-preview", "gpt-4-32k-0613", "gpt-4-32k-0314", "gpt-4-32k",
		"gpt-4-0613", "gpt-4-0314", "gpt-4", "gpt-3.5-turbo-0613",
		"gpt-3.5-turbo-0301", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-0613",
		"gpt-3.5-turbo", "custom-model",
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

func OpenaiRawMessagesToMessages(messages []*RawMessage) []openai.ChatCompletionMessage {
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

func ChatCompletionRequest(model string, messages []openai.ChatCompletionMessage, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32) openai.ChatCompletionRequest {
	res := openai.ChatCompletionRequest{
		Model:            model,
		Messages:         messages,
		Stream:           true,
		Temperature:      temperature,
		TopP:             topP,
		FrequencyPenalty: frequencyPenalty,
		PresencePenalty:  presencePenalty,
	}

	if model == "custom-model" {
		res.Stop = []string{"."}
	}

	if model == "gpt-4-vision-preview" {
		res.MaxTokens = 4096
	}

	return res
}

// https://github.com/pkoukk/tiktoken-go?tab=readme-ov-file#counting-tokens-for-chat-api-calls
// https://github.com/sashabaranov/go-openai/pull/223#issuecomment-1608689882
func OpenaiNumTokensFromMessages(messages []openai.ChatCompletionMessage, model string) (int, error) {
	tkm, err := tiktoken.EncodingForModel(model)
	if err != nil {
		return 0, err
	}

	var tokensPerMessage, tokensPerName int
	switch model {
	case "gpt-3.5-turbo-0613",
		"gpt-3.5-turbo-16k-0613",
		"gpt-4-0314",
		"gpt-4-32k-0314",
		"gpt-4-0613",
		"gpt-4-32k-0613":
		tokensPerMessage = 3
		tokensPerName = 1
	case "gpt-3.5-turbo-0301":
		tokensPerMessage = 4 // every message follows <|start|>{role/name}\n{content}<|end|>\n
		tokensPerName = -1   // if there's a name, the role is omitted
	default:
		if strings.Contains(model, "gpt-3.5-turbo") {
			// warning: gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613
			return OpenaiNumTokensFromMessages(messages, "gpt-3.5-turbo-0613")
		} else if strings.Contains(model, "gpt-4") {
			// warning: gpt-4 may update over time. Returning num tokens assuming gpt-4-0613
			return OpenaiNumTokensFromMessages(messages, "gpt-4-0613")
		} else {
			return 0, fmt.Errorf("OpenaiNumTokensFromMessages() error: unknown model type: %s", model)
		}
	}

	numTokens := 0
	for _, message := range messages {
		content := message.Content
		for _, multiContentPart := range message.MultiContent {
			if multiContentPart.Type == "text" {
				content += multiContentPart.Text
			}
		}

		numTokens += tokensPerMessage
		numTokens += len(tkm.Encode(content, nil, nil))
		numTokens += len(tkm.Encode(message.Role, nil, nil))
		numTokens += len(tkm.Encode(message.Name, nil, nil))
		if message.Name != "" {
			numTokens += tokensPerName
		}
	}

	numTokens += 3 // every reply is primed with <|start|>assistant<|message|>
	return numTokens, nil
}
