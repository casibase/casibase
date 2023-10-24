// Copyright 2023 The casbin Authors. All Rights Reserved.
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

import "testing"

func TestUpdateMessageCounts(t *testing.T) {
	InitConfig()

	chats, err := GetGlobalChats()
	if err != nil {
		panic(err)
	}

	chatMap := map[string]*Chat{}
	for _, chat := range chats {
		chat.MessageCount = 0
		chatMap[chat.Name] = chat
	}

	messages, err := GetGlobalMessages()
	if err != nil {
		panic(err)
	}

	for _, message := range messages {
		chat, ok := chatMap[message.Chat]
		if ok {
			chat.MessageCount += 1
		}
	}

	for _, chat := range chats {
		_, err = UpdateChat(chat.GetId(), chat)
		if err != nil {
			panic(err)
		}
	}
}
