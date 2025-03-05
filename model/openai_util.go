// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"github.com/pkoukk/tiktoken-go"
	"github.com/sashabaranov/go-openai"
)

// https://pkg.go.dev/github.com/sashabaranov/go-openai@v1.27.1#pkg-constants
// https://platform.openai.com/docs/models/overview
var __maxTokens = map[string]int{
	"gpt-4.5-preview-2025-02-27": 128000,
	openai.GPT4o:                 128000,
	openai.GPT4o20240513:         128000,
	openai.GPT4oMini:             128000,
	openai.GPT4oMini20240718:     128000,
	openai.GPT4VisionPreview:     128000,
	openai.GPT4:                  8192,
	openai.GPT40613:              8192,
	openai.GPT432K:               32768,
	openai.GPT432K0613:           32768,
	openai.GPT40314:              8192,
	openai.GPT432K0314:           32768,
	openai.GPT3Dot5Turbo:         4097,
	openai.GPT3Dot5Turbo16K:      16385,
	openai.GPT3Dot5Turbo0613:     4097,
	openai.GPT3Dot5Turbo16K0613:  16385,
	openai.GPT3Dot5Turbo0301:     4097,
	openai.GPT3TextDavinci003:    4097,
	openai.GPT3TextDavinci002:    4097,
	openai.GPT3TextCurie001:      2049,
	openai.GPT3TextBabbage001:    2049,
	openai.GPT3TextAda001:        2049,
	openai.GPT3Davinci:           2049,
	openai.GPT3Curie:             2049,
	openai.GPT3Ada:               2049,
	openai.GPT3Babbage:           2049,
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
		"dall-e-3", "gpt-3.5-turbo-0125", "gpt-3.5-turbo", "gpt-3.5-turbo-1106", "gpt-3.5-turbo-instruct",
		"gpt-3.5-turbo-16k-0613", "gpt-3.5-turbo-16k", "gpt-4-0125-preview",
		"gpt-4-1106-preview", "gpt-4-turbo-preview", "gpt-4-vision-preview",
		"gpt-4-1106-vision-preview", "gpt-4", "gpt-4-0613",
		"gpt-4-32k", "gpt-4-32k-0613", "gpt-4o", "gpt-4o-2024-05-13", "gpt-4o-mini",
		"gpt-4o-mini-2024-07-18", "gpt-4.5-preview", "gpt-4.5-preview-2025-02-27", "custom-model",
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

	if model == "gpt-4-vision-preview" || model == "gpt-4-1106-vision-preview" {
		res.MaxTokens = 4096
	}

	return res
}

// https://github.com/pkoukk/tiktoken-go?tab=readme-ov-file#counting-tokens-for-chat-api-calls
// https://github.com/sashabaranov/go-openai/pull/223#issuecomment-1608689882
func OpenaiNumTokensFromMessages(messages []openai.ChatCompletionMessage, model string) (int, error) {
	modelToUse := getCompatibleModel(model)
	// Get model-specific token counts
	tokensPerMessage, tokensPerName := getModelTokenCounts(modelToUse)

	// Get tiktoken encoding using the compatibility layer
	tkm, err := tiktoken.EncodingForModel(modelToUse)
	if err != nil {
		return 0, err
	}

	numTokens := 0
	for _, message := range messages {
		// Calculate tokens for the message content
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

func getModelTokenCounts(model string) (tokensPerMessage, tokensPerName int) {
	// Default values for most models
	defaultTokensPerMessage := 3
	defaultTokensPerName := 1

	// Special cases for specific model versions
	switch model {
	case openai.GPT3Dot5Turbo0301:
		return 4, -1 // special case: if there's a name, the role is omitted
	}

	// Default values for unknown models
	return defaultTokensPerMessage, defaultTokensPerName
}
