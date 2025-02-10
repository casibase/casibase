// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

//go:build !skipCi
// +build !skipCi

package object_test

import (
	"fmt"
	"testing"

	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/controllers"
	"github.com/casibase/casibase/object"
)

var userTag = "user"

func TestUpdateMessagesForName(t *testing.T) {
	object.InitConfig()
	controllers.InitAuthConfig()

	users, err := casdoorsdk.GetUsers()
	if err != nil {
		panic(err)
	}

	userMap := map[string]*casdoorsdk.User{}
	for _, user := range users {
		if user.Tag != userTag {
			continue
		}

		userMap[user.Name] = user
	}

	messages, err := object.GetGlobalMessages()
	if err != nil {
		panic(err)
	}

	for i, message := range messages {
		user, ok := userMap[message.User]
		if ok {
			message.User = user.DisplayName
		}

		if message.Author != "AI" {
			user, ok = userMap[message.Author]
			if ok {
				message.Author = user.DisplayName
			}
		}

		fmt.Printf("[%d/%d] message: %s, organization: %s, user: %s, author: %s\n", i+1, len(messages), message.Name, message.Organization, message.User, message.Author)

		_, err = object.UpdateMessage(message.GetId(), message)
		if err != nil {
			panic(err)
		}
	}
}

func TestUpdateChatsForName(t *testing.T) {
	object.InitConfig()
	controllers.InitAuthConfig()

	users, err := casdoorsdk.GetUsers()
	if err != nil {
		panic(err)
	}

	userMap := map[string]*casdoorsdk.User{}
	for _, user := range users {
		if user.Tag != userTag {
			continue
		}

		userMap[user.Name] = user
	}

	chats, err := object.GetGlobalChats()
	if err != nil {
		panic(err)
	}

	for i, chat := range chats {
		user, ok := userMap[chat.User]
		if ok {
			chat.User = user.DisplayName
		}

		user, ok = userMap[chat.Users[0]]
		if ok {
			chat.Users[0] = user.DisplayName
		}

		fmt.Printf("[%d/%d] chat: %s, store: %s, organization: %s, user1: %s, users: %v\n", i+1, len(chats), chat.Name, chat.Store, chat.Organization, chat.User1, chat.Users)

		_, err = object.UpdateChat(chat.GetId(), chat)
		if err != nil {
			panic(err)
		}
	}
}

func TestUpdateMessagesAndChatsForName(t *testing.T) {
	TestUpdateMessagesForName(t)
	TestUpdateChatsForName(t)
}
