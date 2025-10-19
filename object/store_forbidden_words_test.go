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

package object

import "testing"

func TestContainsForbiddenWords(t *testing.T) {
	tests := []struct {
		name           string
		forbiddenWords []string
		text           string
		shouldContain  bool
		expectedWord   string
	}{
		{
			name:           "Empty forbidden words list",
			forbiddenWords: []string{},
			text:           "This is a normal message",
			shouldContain:  false,
			expectedWord:   "",
		},
		{
			name:           "Nil forbidden words list",
			forbiddenWords: nil,
			text:           "This is a normal message",
			shouldContain:  false,
			expectedWord:   "",
		},
		{
			name:           "Contains forbidden word",
			forbiddenWords: []string{"badword", "offensive"},
			text:           "This contains badword in the text",
			shouldContain:  true,
			expectedWord:   "badword",
		},
		{
			name:           "Case insensitive check",
			forbiddenWords: []string{"BadWord"},
			text:           "This contains badword in lowercase",
			shouldContain:  true,
			expectedWord:   "BadWord",
		},
		{
			name:           "No forbidden words",
			forbiddenWords: []string{"badword", "offensive"},
			text:           "This is a clean message",
			shouldContain:  false,
			expectedWord:   "",
		},
		{
			name:           "Empty string in forbidden words",
			forbiddenWords: []string{"", "badword"},
			text:           "This contains badword",
			shouldContain:  true,
			expectedWord:   "badword",
		},
		{
			name:           "Forbidden word as substring",
			forbiddenWords: []string{"test"},
			text:           "This is a testing message",
			shouldContain:  true,
			expectedWord:   "test",
		},
		{
			name:           "Multiple forbidden words, first one matches",
			forbiddenWords: []string{"first", "second"},
			text:           "This contains first word",
			shouldContain:  true,
			expectedWord:   "first",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &Store{
				ForbiddenWords: tt.forbiddenWords,
			}

			contains, word := store.ContainsForbiddenWords(tt.text)

			if contains != tt.shouldContain {
				t.Errorf("ContainsForbiddenWords() contains = %v, want %v", contains, tt.shouldContain)
			}

			if word != tt.expectedWord {
				t.Errorf("ContainsForbiddenWords() word = %v, want %v", word, tt.expectedWord)
			}
		})
	}
}
