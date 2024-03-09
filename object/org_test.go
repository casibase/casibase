// Copyright 2024 The casbin Authors. All Rights Reserved.
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

package object

import (
	"fmt"
	"strings"
	"testing"

	"github.com/casibase/casibase/util"
)

var organization = "casbin"

func TestUpdateMessagesForOrg(t *testing.T) {
	InitConfig()

	messages, err := GetGlobalMessages()
	if err != nil {
		panic(err)
	}

	for i, message := range messages {
		if !strings.Contains(message.ReplyTo, "/") && !strings.Contains(message.Author, "/") && message.Organization == organization {
			continue
		}

		message.ReplyTo = strings.TrimPrefix(message.ReplyTo, "admin/")

		if strings.Contains(message.Author, "/") {
			_, author := util.GetOwnerAndNameFromId(message.Author)
			message.Author = author
		}

		message.Organization = organization

		fmt.Printf("[%d/%d] message: %s, organization: %s, user: %s, author: %s\n", i+1, len(messages), message.Name, message.Organization, message.User, message.Author)

		_, err = UpdateMessage(message.GetId(), message)
		if err != nil {
			panic(err)
		}
	}
}

func TestUpdateChatsForOrg(t *testing.T) {
	InitConfig()

	chats, err := GetGlobalChats()
	if err != nil {
		panic(err)
	}

	for i, chat := range chats {
		if !strings.Contains(chat.Store, "/") && chat.User1 == "" && !strings.Contains(chat.Users[0], "/") && chat.Organization == organization {
			continue
		}

		chat.Store = strings.TrimPrefix(chat.Store, "admin/")

		chat.User1 = ""

		if strings.Contains(chat.Users[0], "/") {
			_, user := util.GetOwnerAndNameFromId(chat.Users[0])
			chat.Users[0] = user
		}

		chat.Organization = organization

		fmt.Printf("[%d/%d] chat: %s, store: %s, organization: %s, user1: %s, users: %v\n", i+1, len(chats), chat.Name, chat.Store, chat.Organization, chat.User1, chat.Users)

		_, err = UpdateChat(chat.GetId(), chat)
		if err != nil {
			panic(err)
		}
	}
}

func TestUpdateMessagesAndChatsForOrg(t *testing.T) {
	TestUpdateMessagesForOrg(t)
	TestUpdateChatsForOrg(t)
}
