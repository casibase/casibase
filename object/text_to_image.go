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
	"github.com/casibase/casibase/image"
	"github.com/casibase/casibase/util"
)

// PrepareTextToImage prepares the text-to-image conversion
func PrepareTextToImage(storeId, providerId, messageId, text string, lang string) (*Message, *Chat, image.TextToImageProvider, context.Context, error) {
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

		provider, err = getStoreProviderForImage(storeId, lang)
	}

	if err != nil {
		return nil, nil, nil, nil, err
	}

	imgProvider, err := provider.GetTextToImageProvider(lang)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	return message, chat, imgProvider, context.Background(), nil
}

// getStoreProviderForImage retrieves the text-to-image provider for a given store ID
func getStoreProviderForImage(storeId string, lang string) (*Provider, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return nil, err
	}
	if store == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "account:The store: %s is not found"), storeId)
	}

	provider, err := store.GetTextToImageProvider()
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "object:The text-to-image provider for store: %s is not found"), store.GetId())
	}

	return provider, nil
}

func UpdateChatStatsForImage(chat *Chat, imgResult *image.TextToImageResult) error {
	chat.Price += imgResult.Price
	if chat.Currency == "" {
		chat.Currency = imgResult.Currency
	}

	chat.UpdatedTime = util.GetCurrentTime()
	_, err := UpdateChat(chat.GetId(), chat)
	return err
}
