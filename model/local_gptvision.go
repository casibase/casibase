// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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
	"net/url"
	"path"
	"regexp"
	"strings"

	"github.com/sashabaranov/go-openai"
	"github.com/the-open-agent/openagent/util"
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

func supportedImageMimeType(mimeType string) string {
	mimeType = strings.ToLower(strings.TrimSpace(strings.Split(mimeType, ";")[0]))
	switch mimeType {
	case "image/jpeg", "image/png", "image/gif", "image/webp":
		return mimeType
	default:
		return ""
	}
}

func imageMimeTypeFromURL(text string) string {
	parsed, err := url.Parse(text)
	target := text
	if err == nil && parsed.Path != "" {
		target = parsed.Path
	}
	ext := strings.ToLower(path.Ext(target))
	if ext != "" {
		ext = ext[1:]
	}
	switch ext {
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "gif":
		return "image/gif"
	case "webp":
		return "image/webp"
	default:
		return ""
	}
}

func safeImageURLForError(text string) string {
	parsed, err := url.Parse(text)
	if err != nil || parsed.Host == "" {
		return "<redacted image URL>"
	}
	return parsed.Scheme + "://" + parsed.Host + parsed.Path
}

func getImageRefinedText(text string) (string, error) {
	// The image URL comes from message text, so internal addresses are refused.
	resp, err := util.GetUntrustedUrl(text)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return "", fmt.Errorf("failed to fetch image %s: HTTP %d", safeImageURLForError(text), resp.StatusCode)
	}

	data, err := io.ReadAll(io.LimitReader(resp.Body, util.UntrustedFetchMaxBytes+1))
	if err != nil {
		return "", err
	}
	if len(data) > util.UntrustedFetchMaxBytes {
		return "", fmt.Errorf("the image %s exceeds %d bytes", safeImageURLForError(text), util.UntrustedFetchMaxBytes)
	}

	mimeType := supportedImageMimeType(resp.Header.Get("Content-Type"))
	if mimeType == "" {
		mimeType = supportedImageMimeType(http.DetectContentType(data))
	}
	if mimeType == "" {
		mimeType = imageMimeTypeFromURL(text)
	}
	if mimeType == "" {
		return "", fmt.Errorf("unsupported image type for %s", safeImageURLForError(text))
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	res := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Data)
	return res, nil
}

func getImageRefinedTexts(urls []string, messageText string) ([]string, string) {
	images := []string{}
	failedUrls := []string{}
	for _, url := range urls {
		imageText, err := getImageRefinedText(url)
		if err != nil {
			failedUrls = append(failedUrls, url)
			continue
		}
		images = append(images, imageText)
	}

	if len(failedUrls) > 0 {
		messageText = strings.TrimSpace(messageText + "\n" + strings.Join(failedUrls, "\n"))
	}
	return images, messageText
}

func IsVisionModel(subType string) bool {
	visionModels := []string{
		// GPT-6 series (latest)
		"gpt-6-astra", "gpt-6-astra-pro",
		// GPT-5.6 series
		"gpt-5.6-sol", "gpt-5.6-sol-pro", "gpt-5.6-terra", "gpt-5.6-terra-pro",
		"gpt-5.6-luna", "gpt-5.6-luna-pro", "gpt-5.6-cyber",
		// GPT-5.5 series
		"gpt-5.5", "gpt-5.5-pro", "gpt-5.5-cyber",
		// GPT-5.4 series
		"gpt-5.4", "gpt-5.4-pro", "gpt-5.4-mini", "gpt-5.4-nano",
		// GPT-5.3 / 5.2 / 5.1 series
		"gpt-5.3-codex",
		"gpt-5.2", "gpt-5.2-pro", "gpt-5.2-chat", "gpt-5.2-codex",
		"gpt-5.1", "gpt-5.1-codex", "gpt-5.1-codex-mini", "gpt-5.1-codex-max",
		// GPT-5 series
		"gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-pro",
		// o-series (latest first)
		"o4-mini", "o3-pro", "o3", "o1-pro", "o1",
		// GPT-4.1 series
		"gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
		// GPT-4o series
		"gpt-4o", "gpt-4o-2024-08-06", "gpt-4o-mini", "gpt-4o-mini-2024-07-18",
		// OpenAI-compatible Qwen vision models
		"qwen3.8-max", "qwen3.8-flash", "qwen3.8-27b",
		"qwen3.7-plus", "qwen3.7-flash",
		"qwen3.6-plus", "qwen3.6-flash", "qwen3.6-27b", "qwen3.6-35b-a3b",
		"qwen3-vl-plus", "qwen3-vl-flash", "qwen3.5-omni-plus",
		// OpenAI-compatible Kimi vision models
		"kimi-k3",
	}

	for _, visionModel := range visionModels {
		if subType == visionModel {
			return true
		}
	}

	return false
}

func ExtractFirstImageDataURL(message string) (string, string, error) {
	urls, messageText := extractImagesURL(message)
	if len(urls) == 0 {
		return "", messageText, nil
	}

	imageText, err := getImageRefinedText(urls[0])
	if err != nil {
		return "", "", err
	}
	return imageText, messageText, nil
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

		item := openai.ChatCompletionMessage{
			Role:             role,
			ReasoningContent: message.ReasoningContent,
		}

		if role == openai.ChatMessageRoleTool {
			item.ToolCallID = message.ToolCallID
			item.Content = message.Text
			res = append(res, item)
			continue
		} else if role == openai.ChatMessageRoleAssistant {
			if message.ToolCall.ID != "" {
				item.ToolCalls = []openai.ToolCall{message.ToolCall}
			} else {
				item.ToolCalls = nil
			}
		}

		// Image inputs are only supported on user messages. Keep image links in
		// prompts and assistant history as text instead of resending them as images.
		if role != openai.ChatMessageRoleUser {
			item.Content = message.Text
			res = append(res, item)
			continue
		}

		urls, messageText := extractImagesURL(message.Text)
		images, messageText := getImageRefinedTexts(urls, messageText)

		if len(messageText) > 0 {
			item.MultiContent = []openai.ChatMessagePart{
				{
					Type: openai.ChatMessagePartTypeText,
					Text: messageText,
				},
			}
		}

		for _, imageText := range images {
			item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
				Type: openai.ChatMessagePartTypeImageURL,
				ImageURL: &openai.ChatMessageImageURL{
					URL:    imageText,
					Detail: openai.ImageURLDetailAuto,
				},
			})
		}
		for _, image := range message.Images {
			item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
				Type: openai.ChatMessagePartTypeImageURL,
				ImageURL: &openai.ChatMessageImageURL{
					URL:    fmt.Sprintf("data:%s;base64,%s", image.MimeType, base64.StdEncoding.EncodeToString(image.Data)),
					Detail: openai.ImageURLDetailAuto,
				},
			})
		}

		res = append(res, item)
	}
	return res, nil
}
