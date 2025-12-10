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

package util

import (
	"testing"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
)

func TestIsChatAdmin(t *testing.T) {
	tests := []struct {
		name     string
		user     *casdoorsdk.User
		expected bool
	}{
		{
			name:     "nil user",
			user:     nil,
			expected: false,
		},
		{
			name: "chat-admin user",
			user: &casdoorsdk.User{
				Type: UserTypeChatAdmin,
			},
			expected: true,
		},
		{
			name: "regular user",
			user: &casdoorsdk.User{
				Type: "regular-user",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsChatAdmin(tt.user)
			if result != tt.expected {
				t.Errorf("IsChatAdmin() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsAdminOrChatAdmin(t *testing.T) {
	tests := []struct {
		name     string
		user     *casdoorsdk.User
		expected bool
	}{
		{
			name:     "nil user",
			user:     nil,
			expected: false,
		},
		{
			name: "system admin",
			user: &casdoorsdk.User{
				IsAdmin: true,
				Type:    "regular-user",
			},
			expected: true,
		},
		{
			name: "chat-admin user",
			user: &casdoorsdk.User{
				IsAdmin: false,
				Type:    UserTypeChatAdmin,
			},
			expected: true,
		},
		{
			name: "both admin and chat-admin",
			user: &casdoorsdk.User{
				IsAdmin: true,
				Type:    UserTypeChatAdmin,
			},
			expected: true,
		},
		{
			name: "regular user",
			user: &casdoorsdk.User{
				IsAdmin: false,
				Type:    "regular-user",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsAdminOrChatAdmin(tt.user)
			if result != tt.expected {
				t.Errorf("IsAdminOrChatAdmin() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsVideoNormalUser(t *testing.T) {
	tests := []struct {
		name     string
		user     *casdoorsdk.User
		expected bool
	}{
		{
			name:     "nil user",
			user:     nil,
			expected: false,
		},
		{
			name: "video-normal-user",
			user: &casdoorsdk.User{
				Type: UserTypeVideoNormalUser,
			},
			expected: true,
		},
		{
			name: "regular user",
			user: &casdoorsdk.User{
				Type: "regular-user",
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsVideoNormalUser(tt.user)
			if result != tt.expected {
				t.Errorf("IsVideoNormalUser() = %v, want %v", result, tt.expected)
			}
		})
	}
}
