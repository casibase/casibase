package object

import (
	"context"
	"fmt"

	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
)

// PrepareTextToSpeech prepares the text-to-speech conversion
func PrepareTextToSpeech(storeId, providerId, messageId string) (*Message, *Chat, tts.TextToSpeechProvider, context.Context, error) {
	message, err := GetMessage(messageId)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if message == nil {
		return nil, nil, nil, nil, fmt.Errorf("The message: %s is not found", messageId)
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := GetChat(chatId)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if chat == nil {
		return nil, nil, nil, nil, fmt.Errorf("The chat: %s is not found", chatId)
	}
	var provider *Provider

	// if providerId is not empty, use the providerId to get the provider
	if providerId != "" {
		provider, err = GetProvider(providerId)
		if err != nil {
			return nil, nil, nil, nil, err
		}
		if provider == nil {
			return nil, nil, nil, nil, fmt.Errorf("The provider: %s is not found", providerId)
		}
	} else {
		store, err := GetStore(storeId)
		if err != nil {
			return nil, nil, nil, nil, err
		}
		if store == nil {
			return nil, nil, nil, nil, fmt.Errorf("The store: %s is not found", storeId)
		}

		provider, err = store.GetTextToSpeechProvider()
		if err != nil {
			return nil, nil, nil, nil, err
		}
		if provider == nil {
			return nil, nil, nil, nil, fmt.Errorf("The text-to-speech provider for store: %s is not found", store.GetId())
		}
	}

	providerObj, err := provider.GetTextToSpeechProvider()
	if err != nil {
		return nil, nil, nil, nil, err
	}

	ctx := context.Background()
	return message, chat, providerObj, ctx, nil
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
