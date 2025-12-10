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

package util

import "github.com/casdoor/casdoor-go-sdk/casdoorsdk"

const (
	UserTypeChatAdmin       = "chat-admin"
	UserTypeVideoNormalUser = "video-normal-user"
)

// IsChatAdmin checks if the user has the chat-admin role
func IsChatAdmin(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.Type == UserTypeChatAdmin
}

// IsAdminOrChatAdmin checks if the user is either a system admin or a chat-admin
func IsAdminOrChatAdmin(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin || user.Type == UserTypeChatAdmin
}

// IsVideoNormalUser checks if the user has the video-normal-user role
func IsVideoNormalUser(user *casdoorsdk.User) bool {
	if user == nil {
		return false
	}
	return user.Type == UserTypeVideoNormalUser
}
