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

package object

import (
	"fmt"

	"github.com/robfig/cron/v3"
)

func getChatMessagesFromMessages(chat string, messages []*Message) []*Message {
	return nil
}

func deleteChatAndMessages(chat string) error {
	return nil
}

func cleanupChats() error {
	chats, err := GetGlobalChats()
	if err != nil {
		return err
	}

	messages, err := GetGlobalMessages()
	if err != nil {
		return err
	}

	for _, chat := range chats {
		if chat.MessageCount != 2 {
			continue
		}

		chatMessages := getChatMessagesFromMessages(chat.Name, messages)
		// TODO: update the logic
		if len(chatMessages) > 1 {
			continue
		}

		err = deleteChatAndMessages(chat.Name)
		if err != nil {
			return err
		}

		fmt.Printf("Cleaned up empty chat: [%s], user = [%s], clientIp = [%s], userAgent = [%s]\n", chat.Name, chat.User, chat.ClientIp, chat.UserAgent)
	}

	return err
}

func cleanupChatsNoError() {
	err := cleanupChats()
	if err != nil {
		fmt.Printf("cleanupChatsNoError() error: %s\n", err.Error())
	}
}

func InitCleanupChats() {
	cleanupChatsNoError()

	cronJob := cron.New()
	schedule := fmt.Sprintf("@every %ds", 3600)
	_, err := cronJob.AddFunc(schedule, cleanupChatsNoError)
	if err != nil {
		panic(err)
	}

	cronJob.Start()
}
