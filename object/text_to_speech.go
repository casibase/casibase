package object

import (
	"context"
	"fmt"

	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
)

// PrepareTextToSpeech prepares the text-to-speech conversion
func PrepareTextToSpeech(storeId, messageId string) (*Message, *Chat, *Store, tts.TextToSpeechProvider, context.Context, error) {
	message, err := GetMessage(messageId)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if message == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The message: %s is not found", messageId)
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := GetChat(chatId)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if chat == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The chat: %s is not found", chatId)
	}

	store, err := GetStore(storeId)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if store == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The store: %s is not found", storeId)
	}

	provider, err := store.GetTextToSpeechProvider()
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if provider == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The text-to-speech provider for store: %s is not found", store.GetId())
	}

	providerObj, err := provider.GetTextToSpeechProvider()
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}

	ctx := context.Background()
	return message, chat, store, providerObj, ctx, nil
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
