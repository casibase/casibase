// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package object

import (
	"encoding/json"
	"regexp"
	"strings"
	"unicode"
)

// Common English stop words to filter out
var stopWords = map[string]bool{
	"the": true, "a": true, "an": true, "and": true, "or": true, "but": true,
	"in": true, "on": true, "at": true, "to": true, "for": true, "of": true,
	"with": true, "by": true, "from": true, "as": true, "is": true, "was": true,
	"are": true, "were": true, "been": true, "be": true, "have": true, "has": true,
	"had": true, "do": true, "does": true, "did": true, "will": true, "would": true,
	"should": true, "could": true, "may": true, "might": true, "must": true,
	"can": true, "this": true, "that": true, "these": true, "those": true,
	"i": true, "you": true, "he": true, "she": true, "it": true, "we": true,
	"they": true, "what": true, "which": true, "who": true, "when": true,
	"where": true, "why": true, "how": true, "all": true, "each": true,
	"every": true, "both": true, "few": true, "more": true, "most": true,
	"other": true, "some": true, "such": true, "no": true, "nor": true,
	"not": true, "only": true, "own": true, "same": true, "so": true,
	"than": true, "too": true, "very": true, "s": true, "t": true,
}

// Common Chinese stop words to filter out
var stopWordsZh = map[string]bool{
	"的": true, "了": true, "在": true, "是": true, "我": true, "有": true,
	"和": true, "就": true, "不": true, "人": true, "都": true, "一": true,
	"一个": true, "上": true, "也": true, "很": true, "到": true, "说": true,
	"要": true, "去": true, "你": true, "会": true, "着": true, "没有": true,
	"看": true, "好": true, "自己": true, "这": true, "那": true, "里": true,
	"为": true, "他": true, "吗": true, "啊": true, "呢": true, "这个": true,
	"那个": true, "什么": true, "怎么": true, "可以": true, "但是": true,
	"如果": true, "因为": true, "所以": true, "虽然": true, "然后": true,
	"或者": true, "而且": true, "还是": true, "不过": true, "这样": true,
}

func FilterChatsByTimeRange(chats []*Chat, startTime, endTime string) []*Chat {
	if startTime == "" && endTime == "" {
		return chats
	}

	filtered := make([]*Chat, 0)
	for _, chat := range chats {
		if startTime != "" && chat.CreatedTime < startTime {
			continue
		}
		if endTime != "" && chat.CreatedTime > endTime {
			continue
		}
		filtered = append(filtered, chat)
	}

	return filtered
}

func GetMessagesForChats(chats []*Chat) ([]*Message, error) {
	if len(chats) == 0 {
		return []*Message{}, nil
	}

	chatNames := make([]string, 0, len(chats))
	for _, chat := range chats {
		chatNames = append(chatNames, chat.Name)
	}

	messages := []*Message{}
	err := adapter.engine.In("chat", chatNames).Asc("created_time").Find(&messages)
	if err != nil {
		return nil, err
	}

	return messages, nil
}

func GenerateWordCloudData(messages []*Message) (string, error) {
	wordFreq := make(map[string]int)

	// Regular expression to extract words (including Chinese characters)
	wordRegex := regexp.MustCompile(`[\p{L}\p{N}]+`)

	for _, message := range messages {
		// Extract words from message text
		text := strings.ToLower(message.Text)
		words := wordRegex.FindAllString(text, -1)

		for _, word := range words {
			// Filter out stop words (both English and Chinese) and short words
			if len(word) > 2 && !stopWords[word] && !stopWordsZh[word] {
				// Check if word contains any letter (to avoid pure numbers)
				hasLetter := false
				for _, r := range word {
					if unicode.IsLetter(r) {
						hasLetter = true
						break
					}
				}
				if hasLetter {
					wordFreq[word]++
				}
			}
		}
	}

	// Convert to format expected by word cloud: array of {name, value}
	type WordData struct {
		Name  string `json:"name"`
		Value int    `json:"value"`
	}

	wordList := make([]WordData, 0, len(wordFreq))
	for word, count := range wordFreq {
		wordList = append(wordList, WordData{Name: word, Value: count})
	}

	// Convert to JSON
	jsonData, err := json.MarshalIndent(wordList, "", "  ")
	if err != nil {
		return "", err
	}

	return string(jsonData), nil
}
