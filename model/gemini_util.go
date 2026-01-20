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

import genai "google.golang.org/genai"

func GenaiRawMessagesToMessages(question string, history []*RawMessage) []*genai.Content {
	var messages []*genai.Content
	for _, rawMessage := range history {
		role := genai.RoleUser
		if rawMessage.Author == "AI" || rawMessage.Author == genai.RoleModel {
			role = genai.RoleModel
		}
		messages = append(messages, &genai.Content{
			Parts: []*genai.Part{
				{Text: rawMessage.Text},
			},
			Role: role,
		})
	}
	messages = append(messages, &genai.Content{
		Parts: []*genai.Part{
			{Text: question},
		},
		Role: genai.RoleUser,
	})
	return messages
}

func buildSystemInstruction(prompt string, knowledgeMessages []*RawMessage) *genai.Content {
	systemMessages := getSystemMessages(prompt, knowledgeMessages)
	if len(systemMessages) == 0 {
		return nil
	}

	var parts []*genai.Part
	for _, msg := range systemMessages {
		parts = append(parts, &genai.Part{Text: msg.Text})
	}

	return &genai.Content{
		Parts: parts,
		Role:  genai.RoleUser,
	}
}
