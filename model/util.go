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
	"fmt"
	"math"
	"regexp"
	"strings"
	"unicode"

	"github.com/casibase/casibase/i18n"
	"github.com/pkoukk/tiktoken-go"
	"github.com/sashabaranov/go-openai"
)

type RawMessage struct {
	Text           string
	Author         string
	TextTokenCount int
	ToolCall       openai.ToolCall
	ToolCallID     string
}

type SearchResult struct {
	Icon     string `json:"icon,omitempty"`
	SiteName string `json:"site_name,omitempty"`
	Index    int    `json:"index"`
	Title    string `json:"title"`
	URL      string `json:"url"`
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

func getCompatibleModel(model string) string {
	openaiModels := map[string]bool{
		openai.GPT3Dot5Turbo:        true,
		openai.GPT3Dot5Turbo0301:    true,
		openai.GPT3Dot5Turbo0613:    true,
		openai.GPT3Dot5Turbo1106:    true,
		openai.GPT3Dot5Turbo0125:    true,
		openai.GPT3Dot5Turbo16K:     true,
		openai.GPT3Dot5Turbo16K0613: true,
		openai.GPT4:                 true,
		openai.GPT4o:                true,
		openai.GPT4o20240513:        true,
		openai.GPT4oMini:            true,
		openai.GPT4oMini20240718:    true,
		openai.GPT4TurboPreview:     true,
		openai.GPT4VisionPreview:    true,
		openai.GPT4Turbo1106:        true,
		openai.GPT4Turbo0125:        true,
		openai.GPT4Turbo:            true,
		openai.GPT4Turbo20240409:    true,
		openai.GPT40314:             true,
		openai.GPT40613:             true,
		openai.GPT432K:              true,
		openai.GPT432K0314:          true,
		openai.GPT432K0613:          true,
	}

	if openaiModels[model] {
		return model
	}

	// Handle generic model families
	if strings.Contains(model, "gpt-3.5-turbo") {
		return openai.GPT3Dot5Turbo
	} else if strings.Contains(model, "gpt-4") {
		return openai.GPT4
	}

	// Default to GPT-4
	return openai.GPT4
}

func GetTokenSize(model string, prompt string) (int, error) {
	modelToUse := getCompatibleModel(model)
	tkm, err := tiktoken.EncodingForModel(modelToUse)
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

func containsZh(str string) bool {
	for _, r := range str {
		if unicode.Is(unicode.Han, r) {
			return true
		}
	}
	return false
}

func getSystemMessages(prompt string, knowledgeMessages []*RawMessage) []*RawMessage {
	if prompt == "" {
		prompt = "You are an expert in your field and you specialize in using your knowledge to answer or solve people's problems."
	}

	res := []*RawMessage{{Text: prompt, Author: "System"}}
	for i, message := range knowledgeMessages {
		knowledgeTag := "Knowledge"
		if containsZh(prompt) {
			knowledgeTag = "知识"
		}

		newMessage := &RawMessage{Text: fmt.Sprintf("%s %d: %s", knowledgeTag, i+1, message.Text), Author: "System"}
		res = append(res, newMessage)
	}

	return res
}

func getHistoryMessages(recentMessages []*RawMessage, model string, leftTokens int) ([]*RawMessage, error) {
	var res []*RawMessage

	for _, message := range recentMessages {
		leftTokens -= message.TextTokenCount
		if leftTokens <= 0 {
			break
		}

		res = append(res, message)
	}

	res = reverseMessages(res)
	return res, nil
}

// EstimateTokenCountAndPrice estimates the token count and price for a question before AI generation.
// This is used for dry run validation to check if user has sufficient balance.
// Returns estimated prompt tokens, estimated total tokens (prompt + estimated response), and estimated price.
func EstimateTokenCountAndPrice(prompt string, question string, recentMessages []*RawMessage, knowledgeMessages []*RawMessage, model string, inputPricePerThousandTokens float64, outputPricePerThousandTokens float64, currency string) (int, int, float64, string, error) {
	// Generate messages to get the actual prompt that will be sent
	messages, err := OpenaiGenerateMessages(prompt, question, recentMessages, knowledgeMessages, model, 100000, "en")
	if err != nil {
		return 0, 0, 0, "", err
	}

	// Calculate prompt token count for all messages
	promptTokens := 0
	for _, msg := range messages {
		tokenCount, err := GetTokenSize(model, msg.Text)
		if err != nil {
			// Fallback to a rough estimate: 1 token per 4 characters
			tokenCount = len(msg.Text) / 4
		}
		promptTokens += tokenCount
	}

	// Estimate response tokens: use a conservative estimate
	// Typically AI responses are 200-2000 tokens, we'll use 1000 as a safe upper bound
	estimatedResponseTokens := 1000

	// Calculate estimated price
	inputPrice := getPrice(promptTokens, inputPricePerThousandTokens)
	outputPrice := getPrice(estimatedResponseTokens, outputPricePerThousandTokens)
	estimatedTotalPrice := AddPrices(inputPrice, outputPrice)

	totalTokens := promptTokens + estimatedResponseTokens

	return promptTokens, totalTokens, estimatedTotalPrice, currency, nil
}

func OpenaiGenerateMessages(prompt string, question string, recentMessages []*RawMessage, knowledgeMessages []*RawMessage, model string, maxTokens int, lang string) ([]*RawMessage, error) {
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
		return nil, fmt.Errorf(i18n.Translate(lang, "model:the token count: [%d] exceeds the model: [%s]'s maximum token count: [%d]"), queryMessageSize, model, maxTokens)
	}

	for i, message := range knowledgeMessages {
		leftTokens -= message.TextTokenCount
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
