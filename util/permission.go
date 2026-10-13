// Copyright 2025 The OpenAgent Authors. All Rights Reserved.
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
	"strings"

	"github.com/the-open-agent/openagent/auth"
)

const (
	UserTypeChatAdmin       = "chat-admin"
	UserTypeVideoNormalUser = "video-normal-user"
)

func IsAnonymousUserByUsername(username string) bool {
	return strings.HasPrefix(username, "u-") && len(username) == 10
}

// IsGlobalAdmin checks if the user is a system-level admin (IsAdmin flag only)
func IsGlobalAdmin(user *auth.User) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin
}

// isStoreAdminTag reports whether the Casdoor user tag makes the user a store-level admin: teachers, and parents, who
// get the same permissions
func isStoreAdminTag(tag string) bool {
	return tag == "教师" || tag == "家长"
}

// IsStoreAdmin checks if the user is a store-level admin (chat-admin type, or 教师 / 家长 tag)
func IsStoreAdmin(user *auth.User) bool {
	if user == nil {
		return false
	}
	return user.Type == UserTypeChatAdmin || isStoreAdminTag(user.Tag)
}

// IsAdmin checks if the user is either a system admin or a chat-admin
func IsAdmin(user *auth.User) bool {
	if user == nil {
		return false
	}
	return user.IsAdmin || user.Type == UserTypeChatAdmin || isStoreAdminTag(user.Tag)
}

// IsVideoNormalUser checks if the user has the video-normal-user role
func IsVideoNormalUser(user *auth.User) bool {
	if user == nil {
		return false
	}
	return user.Type == UserTypeVideoNormalUser
}
