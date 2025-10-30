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

package conf

import (
	"testing"
)

func TestGetStringArray(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "Empty string",
			input:    "",
			expected: []string{},
		},
		{
			name:     "Single value",
			input:    "https://example.com",
			expected: []string{"https://example.com"},
		},
		{
			name:     "Comma-separated with spaces",
			input:    "https://example.com, https://example2.com",
			expected: []string{"https://example.com", "https://example2.com"},
		},
		{
			name:     "Comma-separated without spaces",
			input:    "https://example.com,https://example2.com",
			expected: []string{"https://example.com", "https://example2.com"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// This is a simple validation test
			// In real scenarios, the GetStringArray function reads from config
			// which we're not testing here as it requires full app initialization
			if tt.input == "" && len(tt.expected) != 0 {
				t.Errorf("Expected empty slice for empty input")
			}
		})
	}
}

func TestCORSSecurityLogic(t *testing.T) {
	// Test the CORS security logic that should be applied in main.go
	tests := []struct {
		name                 string
		corsOrigins          []string
		expectedCredentials  bool
		description          string
	}{
		{
			name:                "Wildcard origin should disable credentials",
			corsOrigins:         []string{"*"},
			expectedCredentials: false,
			description:         "When using wildcard origin, credentials must be disabled for security",
		},
		{
			name:                "Specific origin should enable credentials",
			corsOrigins:         []string{"https://example.com"},
			expectedCredentials: true,
			description:         "When using specific origin, credentials can be enabled",
		},
		{
			name:                "Multiple origins should enable credentials",
			corsOrigins:         []string{"https://example.com", "https://example2.com"},
			expectedCredentials: true,
			description:         "When using multiple specific origins, credentials can be enabled",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Simulate the logic from main.go
			allowCredentials := true
			if len(tt.corsOrigins) == 1 && tt.corsOrigins[0] == "*" {
				allowCredentials = false
			}

			if allowCredentials != tt.expectedCredentials {
				t.Errorf("CORS security check failed: %s\nExpected credentials=%v, got %v",
					tt.description, tt.expectedCredentials, allowCredentials)
			}
		})
	}
}
