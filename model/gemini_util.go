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
	messages := []*genai.Content{}
	for _, rawMessage := range history {
		var role string
		switch rawMessage.Author {
		case "user", "System":
			role = genai.RoleUser
		case "AI", "assistant", "model":
			role = genai.RoleModel
		default:
			role = genai.RoleUser
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
