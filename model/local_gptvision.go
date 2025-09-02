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
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/sashabaranov/go-openai"
)

func extractImagesURL(message string) ([]string, string) {
	message = strings.Replace(message, "&nbsp;", " ", -1)
	br := regexp.MustCompile(`<br\s*/?>`)
	message = br.ReplaceAllString(message, " ")

	imgURL := regexp.MustCompile(`http[s]?://\S+\.(jpg|jpeg|png|gif|webp)`)
	urls := imgURL.FindAllString(message, -1)
	quote := regexp.MustCompile(`\"$`)
	for i, url := range urls {
		urls[i] = quote.ReplaceAllString(url, "")
	}

	message = imgURL.ReplaceAllString(message, "")

	img := regexp.MustCompile(`<img[^>]+>`)
	message = img.ReplaceAllString(message, "")
	return urls, message
}

func getImageRefinedText(text string) (string, error) {
	ext := filepath.Ext(text)
	if ext != "" {
		ext = ext[1:]
	}

	resp, err := http.Get(text)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	res := fmt.Sprintf("data:image/%s;base64,%s", ext, base64Data)
	return res, nil
}

func IsVisionModel(subType string) bool {
	visionModels := []string{
		"gpt-4o", "gpt-4o-2024-08-06", "gpt-4o-mini", "gpt-4o-mini-2024-07-18",
		"gpt-4.5-preview", "gpt-4.5-preview-2025-02-27", "gpt-4.1",
		"gpt-4.1-mini", "gpt-4.1-nano", "o1", "o1-pro", "o3", "o4-mini",
	}

	for _, visionModel := range visionModels {
		if subType == visionModel {
			return true
		}
	}

	return false
}

func OpenaiRawMessagesToGptVisionMessages(messages []*RawMessage) ([]openai.ChatCompletionMessage, error) {
	res := []openai.ChatCompletionMessage{}
	for _, message := range messages {
		var role string
		if message.Author == "AI" {
			role = openai.ChatMessageRoleAssistant
		} else if message.Author == "System" {
			role = openai.ChatMessageRoleSystem
		} else if message.Author == "Tool" {
			role = openai.ChatMessageRoleTool
		} else {
			role = openai.ChatMessageRoleUser
		}

		urls, messageText := extractImagesURL(message.Text)

		item := openai.ChatCompletionMessage{
			Role: role,
		}

		if role == openai.ChatMessageRoleTool {
			item.ToolCallID = message.ToolCallID
		} else if role == openai.ChatMessageRoleAssistant {
			item.ToolCalls = []openai.ToolCall{message.ToolCall}
		}

		if len(messageText) > 0 {
			item.MultiContent = []openai.ChatMessagePart{
				{
					Type: openai.ChatMessagePartTypeText,
					Text: messageText,
				},
			}
		}

		for _, url := range urls {
			imageText, err := getImageRefinedText(url)
			if err != nil {
				return []openai.ChatCompletionMessage{}, err
			}

			item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
				Type: openai.ChatMessagePartTypeImageURL,
				ImageURL: &openai.ChatMessageImageURL{
					URL:    imageText,
					Detail: openai.ImageURLDetailAuto,
				},
			})
		}

		res = append(res, item)
	}
	return res, nil
}
