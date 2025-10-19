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

package model

import (
	"testing"

	"google.golang.org/genai"
)

func TestGenaiRawMessagesToMessages(t *testing.T) {
	tests := []struct {
		name     string
		question string
		history  []*RawMessage
		want     []*genai.Content
	}{
		{
			name:     "Empty history",
			question: "Hello",
			history:  []*RawMessage{},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "Hello"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "History with AI author should map to model role",
			question: "How are you?",
			history: []*RawMessage{
				{Text: "Hi there!", Author: "AI"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "Hi there!"}},
					Role:  genai.RoleModel,
				},
				{
					Parts: []*genai.Part{{Text: "How are you?"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "History with User author should map to user role",
			question: "Tell me more",
			history: []*RawMessage{
				{Text: "Hello", Author: "User"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "Hello"}},
					Role:  genai.RoleUser,
				},
				{
					Parts: []*genai.Part{{Text: "Tell me more"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "History with System author should map to user role",
			question: "What's the task?",
			history: []*RawMessage{
				{Text: "You are a helpful assistant", Author: "System"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "You are a helpful assistant"}},
					Role:  genai.RoleUser,
				},
				{
					Parts: []*genai.Part{{Text: "What's the task?"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "History with Tool author should map to user role",
			question: "Process this",
			history: []*RawMessage{
				{Text: "Tool result: done", Author: "Tool"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "Tool result: done"}},
					Role:  genai.RoleUser,
				},
				{
					Parts: []*genai.Part{{Text: "Process this"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "Mixed history with AI and User",
			question: "Continue",
			history: []*RawMessage{
				{Text: "Hello", Author: "User"},
				{Text: "Hi! How can I help?", Author: "AI"},
				{Text: "Tell me a joke", Author: "User"},
				{Text: "Why did the chicken cross the road?", Author: "AI"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "Hello"}},
					Role:  genai.RoleUser,
				},
				{
					Parts: []*genai.Part{{Text: "Hi! How can I help?"}},
					Role:  genai.RoleModel,
				},
				{
					Parts: []*genai.Part{{Text: "Tell me a joke"}},
					Role:  genai.RoleUser,
				},
				{
					Parts: []*genai.Part{{Text: "Why did the chicken cross the road?"}},
					Role:  genai.RoleModel,
				},
				{
					Parts: []*genai.Part{{Text: "Continue"}},
					Role:  genai.RoleUser,
				},
			},
		},
		{
			name:     "History with various author types should only produce user and model roles",
			question: "Final question",
			history: []*RawMessage{
				{Text: "System message", Author: "System"},
				{Text: "User message", Author: "CustomUser"},
				{Text: "AI response", Author: "AI"},
				{Text: "Tool result", Author: "Tool"},
				{Text: "Another user message", Author: "SomeRandomAuthor"},
			},
			want: []*genai.Content{
				{
					Parts: []*genai.Part{{Text: "System message"}},
					Role:  genai.RoleUser, // System maps to user
				},
				{
					Parts: []*genai.Part{{Text: "User message"}},
					Role:  genai.RoleUser, // CustomUser maps to user
				},
				{
					Parts: []*genai.Part{{Text: "AI response"}},
					Role:  genai.RoleModel, // AI maps to model
				},
				{
					Parts: []*genai.Part{{Text: "Tool result"}},
					Role:  genai.RoleUser, // Tool maps to user
				},
				{
					Parts: []*genai.Part{{Text: "Another user message"}},
					Role:  genai.RoleUser, // Random author maps to user
				},
				{
					Parts: []*genai.Part{{Text: "Final question"}},
					Role:  genai.RoleUser,
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenaiRawMessagesToMessages(tt.question, tt.history)
			
			if len(got) != len(tt.want) {
				t.Errorf("GenaiRawMessagesToMessages() returned %d messages, want %d", len(got), len(tt.want))
				return
			}

			for i := range got {
				if got[i].Role != tt.want[i].Role {
					t.Errorf("Message %d: got role %q, want %q", i, got[i].Role, tt.want[i].Role)
				}
				
				// Verify role is valid for Gemini API
				if got[i].Role != genai.RoleUser && got[i].Role != genai.RoleModel {
					t.Errorf("Message %d: invalid role %q, must be %q or %q", i, got[i].Role, genai.RoleUser, genai.RoleModel)
				}

				if len(got[i].Parts) != len(tt.want[i].Parts) {
					t.Errorf("Message %d: got %d parts, want %d", i, len(got[i].Parts), len(tt.want[i].Parts))
					continue
				}

				for j := range got[i].Parts {
					if got[i].Parts[j].Text != tt.want[i].Parts[j].Text {
						t.Errorf("Message %d, Part %d: got text %q, want %q", i, j, got[i].Parts[j].Text, tt.want[i].Parts[j].Text)
					}
				}
			}
		})
	}
}
