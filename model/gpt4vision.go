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
	"bytes"
	"encoding/base64"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/sashabaranov/go-openai"
)

func extractImagesURL(message string) ([]string, string) {
	message = strings.Replace(message, "&nbsp;", " ", -1)
	br := regexp.MustCompile(`<br\s*/?>`)
	message = br.ReplaceAllString(message, " ")

	imgURL := regexp.MustCompile(`http[s]?://\S+`)
	urls := imgURL.FindAllString(message, -1)
	message = imgURL.ReplaceAllString(message, "")

	img := regexp.MustCompile(`<img[^>]+>`)
	message = img.ReplaceAllString(message, "")
	return urls, message
}

func isFromCDN(str string) bool {
	re := regexp.MustCompile(`^<img[^>]+>$`)
	return re.MatchString(str)
}

func extractExt(Path string) string {
	ext := filepath.Ext(Path)
	ext = ext[1:]
	return ext
}

func getPathFromUrl(inputURL string) (string, error) {
	parsedURL, err := url.Parse(inputURL)
	if err != nil {
		return "", err
	}

	path := parsedURL.Path

	// find index of /storage/
	index := strings.Index(path, "/storage/")
	if index != -1 {
		// delete the index and the part before the index
		path = path[index+len("/storage/"):]
	}

	path = strings.Replace(path, "|", ":", 1)
	path = strings.Replace(path, `\\`, `\`, -1)

	if strings.HasSuffix(path, `"`) {
		path = path[:len(path)-1]
	}
	return path, nil
}

func GetBase64Image(filePath string) (string, string, error) {
	decodedURL, err := url.PathUnescape(filePath)
	if err != nil {
		fmt.Println("Error decoding URL: ", err)
		return "", "", err
	}

	fileUrlPath, err := getPathFromUrl(decodedURL)
	if err != nil {
		fmt.Println("Error decoding URL: ", err)
		return "", "", err
	}

	ext := extractExt(fileUrlPath)

	src, err := os.Open(fileUrlPath)
	if err != nil {
		return "", "", err
	}
	defer src.Close()

	fileBuffer := new(bytes.Buffer)
	_, err = io.Copy(fileBuffer, src)
	if err != nil {
		return "", "", err
	}

	base64Content := base64.StdEncoding.EncodeToString(fileBuffer.Bytes())
	return base64Content, ext, nil
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

		urls, messageText := extractImagesURL(message.Text)

		item := openai.ChatCompletionMessage{
			Role: role,
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
			if isFromCDN(message.Text) {
				base64Content, ext, err := GetBase64Image(url)
				if err != nil {
					fmt.Println("Error reading:", err)
					return nil
				}
				item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
					Type: openai.ChatMessagePartTypeImageURL,
					ImageURL: &openai.ChatMessageImageURL{
						URL:    fmt.Sprintf("data:image/%s;base64,%s", ext, base64Content),
						Detail: openai.ImageURLDetailAuto,
					},
				})
			} else {
				item.MultiContent = append(item.MultiContent, openai.ChatMessagePart{
					Type: openai.ChatMessagePartTypeImageURL,
					ImageURL: &openai.ChatMessageImageURL{
						URL:    url,
						Detail: openai.ImageURLDetailAuto,
					},
				})
			}
		}
		res = append(res, item)
	}
	return res
}
