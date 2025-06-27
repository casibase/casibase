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

func InitStoreCount() {
	randomMessage, err := getMessage("admin", "")
	if err != nil {
		panic(err)
	}
	if randomMessage == nil {
		return
	}
	if randomMessage.Store != "" {
		return
	}

	chats, err := GetGlobalChats()
	if err != nil {
		panic(err)
	}

	chatMap := map[string]*Chat{}
	for _, chat := range chats {
		chatMap[chat.Name] = chat
	}

	messages, err := GetGlobalMessages()
	if err != nil {
		panic(err)
	}

	for _, message := range messages {
		if message.Store != "" {
			continue
		}

		chat, ok := chatMap[message.Chat]
		if !ok || chat.Store == "" {
			continue
		}

		message.Store = chat.Store
		_, err = UpdateMessage(message.GetId(), message, false)
		if err != nil {
			panic(err)
		}
	}
}

func PopulateStoreCounts(stores []*Store) error {
	for _, store := range stores {
		chatCount, err := adapter.engine.Count(&Chat{Store: store.Name})
		if err != nil {
			return err
		}

		messageCount, err := adapter.engine.Count(&Message{Store: store.Name})
		if err != nil {
			return err
		}

		store.ChatCount = int(chatCount)
		store.MessageCount = int(messageCount)
	}

	return nil
}
