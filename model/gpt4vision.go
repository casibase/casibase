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
	"encoding/base64"
	"io"
	"os"
	"regexp"
	"strings"

	"github.com/sashabaranov/go-openai"
)

func encodeImage(imagePath string) (string, error) {
	imageFile, err := os.Open(imagePath)
	if err != nil {
		return "", err
	}
	defer imageFile.Close()

	imageBytes, err := io.ReadAll(imageFile)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(imageBytes), nil
}

func rawMessagesToGPT4VisionMessages(messages []*RawMessage) []openai.ChatCompletionMessage {
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

		message.Text = strings.Replace(message.Text, "&nbsp;", " ", -1)
		br := regexp.MustCompile(`<br\s*/?>`)
		message.Text = br.ReplaceAllString(message.Text, " ")

		re := regexp.MustCompile(`http[s]?://\S+`)
		urls := re.FindAllString(message.Text, -1)
		message.Text = re.ReplaceAllString(message.Text, "")

		item := openai.ChatCompletionMessage{
			Role: role,
			MultiContent: []openai.ChatMessagePart{
				{
					Type: openai.ChatMessagePartTypeText,
					Text: message.Text,
				},
			},
		}
		for _, url := range urls {
			item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
				Type: openai.ChatMessagePartTypeImageURL,
				ImageURL: &openai.ChatMessageImageURL{
					URL:    url,
					Detail: openai.ImageURLDetailAuto,
				},
			})
		}

		res = append(res, item)
	}
	return res
}
