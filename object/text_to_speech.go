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
	"context"
	"fmt"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
)

func addProviderMessage(providerId, text string, lang string) (*Message, *Chat, *Provider, error) {
	provider, err := GetProvider(providerId)
	if err != nil {
		return nil, nil, nil, err
	}
	if provider == nil {
		return nil, nil, nil, fmt.Errorf(i18n.Translate(lang, "object:The provider: %s is not found"), providerId)
	}
	chatId := util.GetChatFromProvider(provider.Owner, provider.Name)
	chat, err := GetChat(chatId)
	if err != nil {
		return nil, nil, nil, err
	}
	if chat == nil {
		chat, err = createProviderChat(chatId, provider)
		if err != nil {
			return nil, nil, nil, err
		}
	}
	// add message
	message := &Message{
		Owner:        provider.Owner,
		Name:         fmt.Sprintf("message_%s", util.GetRandomName()),
		CreatedTime:  util.GetCurrentTimeEx(chat.CreatedTime),
		Organization: chat.Organization,
		Store:        chat.Store,
		User:         "admin",
		Chat:         chat.Name,
		ReplyTo:      "",
		Author:       "AI",
		Text:         text,
	}
	_, err = AddMessage(message)
	if err != nil {
		return nil, nil, nil, err
	}
	return message, chat, provider, nil
}

func createProviderChat(chatId string, provider *Provider) (*Chat, error) {
	_, chatName, err := util.GetOwnerAndNameFromIdWithError(chatId)
	if err != nil {
		return nil, err
	}
	chat := &Chat{
		Name:        chatName,
		Type:        "Provider",
		Owner:       provider.Owner,
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		IsHidden:    true,
	}
	_, err = AddChat(chat)
	if err != nil {
		return nil, err
	}
	return chat, nil
}

func getMessageAndChat(messageId string, lang string) (*Message, *Chat, error) {
	message, err := GetMessage(messageId)
	if err != nil {
		return nil, nil, err
	}
	if message == nil {
		return nil, nil, fmt.Errorf(i18n.Translate(lang, "object:The message: %s is not found"), messageId)
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := GetChat(chatId)
	if err != nil {
		return nil, nil, err
	}
	if chat == nil {
		return nil, nil, fmt.Errorf(i18n.Translate(lang, "object:The chat: %s is not found"), chatId)
	}

	return message, chat, nil
}

// getStoreProvider retrieves the text-to-speech provider for a given store ID
func getStoreProvider(storeId string, lang string) (*Provider, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return nil, err
	}
	if store == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "account:The store: %s is not found"), storeId)
	}

	provider, err := store.GetTextToSpeechProvider()
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:The text-to-speech provider for store: %s is not found"), store.GetId())
	}

	return provider, nil
}

// PrepareTextToSpeech prepares the text-to-speech conversion
func PrepareTextToSpeech(storeId, providerId, messageId, text string, lang string) (*Message, *Chat, tts.TextToSpeechProvider, context.Context, error) {
	var message *Message
	var chat *Chat
	var provider *Provider
	var err error

	if messageId == "" {
		message, chat, provider, err = addProviderMessage(providerId, text, lang)
		if err != nil {
			return nil, nil, nil, nil, err
		}
	} else {
		message, chat, err = getMessageAndChat(messageId, lang)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		provider, err = getStoreProvider(storeId, lang)
	}

	if err != nil {
		return nil, nil, nil, nil, err
	}

	ttsProvider, err := provider.GetTextToSpeechProvider(lang)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	return message, chat, ttsProvider, context.Background(), nil
}

func UpdateChatStats(chat *Chat, ttsResult *tts.TextToSpeechResult) error {
	chat.TokenCount += ttsResult.TokenCount
	chat.Price += ttsResult.Price
	if chat.Currency == "" {
		chat.Currency = ttsResult.Currency
	}

	chat.UpdatedTime = util.GetCurrentTime()
	_, err := UpdateChat(chat.GetId(), chat)
	return err
}
