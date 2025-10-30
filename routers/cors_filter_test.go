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

package routers

import (
	"testing"
)

func TestContainsString(t *testing.T) {
	tests := []struct {
		name     string
		slice    []string
		str      string
		expected bool
	}{
		{
			name:     "string exists in slice",
			slice:    []string{"https://example.com", "https://test.com"},
			str:      "https://example.com",
			expected: true,
		},
		{
			name:     "string does not exist in slice",
			slice:    []string{"https://example.com", "https://test.com"},
			str:      "https://notfound.com",
			expected: false,
		},
		{
			name:     "empty slice",
			slice:    []string{},
			str:      "https://example.com",
			expected: false,
		},
		{
			name:     "empty string in slice",
			slice:    []string{"", "https://example.com"},
			str:      "",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsString(tt.slice, tt.str)
			if result != tt.expected {
				t.Errorf("containsString() = %v, want %v", result, tt.expected)
			}
		})
	}
}
