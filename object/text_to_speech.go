package object

import (
	"context"
	"fmt"

	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
)

func addProviderMessage(providerId, text string) (*Message, *Chat, *Provider, error) {
	provider, err := GetProvider(providerId)
	if err != nil {
		return nil, nil, nil, err
	}
	if provider == nil {
		return nil, nil, nil, fmt.Errorf("The provider: %s is not found", providerId)
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
	_, chatName := util.GetOwnerAndNameFromId(chatId)
	chat := &Chat{
		Name:        chatName,
		Type:        "Provider",
		Owner:       provider.Owner,
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		IsHidden:    true,
	}
	_, err := AddChat(chat)
	if err != nil {
		return nil, err
	}
	return chat, nil
}

func getMessageAndChat(messageId string) (*Message, *Chat, error) {
	message, err := GetMessage(messageId)
	if err != nil {
		return nil, nil, err
	}
	if message == nil {
		return nil, nil, fmt.Errorf("The message: %s is not found", messageId)
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := GetChat(chatId)
	if err != nil {
		return nil, nil, err
	}
	if chat == nil {
		return nil, nil, fmt.Errorf("The chat: %s is not found", chatId)
	}

	return message, chat, nil
}

// getStoreProvider retrieves the text-to-speech provider for a given store ID
func getStoreProvider(storeId string) (*Provider, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return nil, err
	}
	if store == nil {
		return nil, fmt.Errorf("The store: %s is not found", storeId)
	}

	provider, err := store.GetTextToSpeechProvider()
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf("The text-to-speech provider for store: %s is not found", store.GetId())
	}

	return provider, nil
}

// PrepareTextToSpeech prepares the text-to-speech conversion
func PrepareTextToSpeech(storeId, providerId, messageId, text string) (*Message, *Chat, tts.TextToSpeechProvider, context.Context, error) {
	var message *Message
	var chat *Chat
	var provider *Provider
	var err error

	if messageId == "" {
		message, chat, provider, err = addProviderMessage(providerId, text)
		if err != nil {
			return nil, nil, nil, nil, err
		}
	} else {
		message, chat, err = getMessageAndChat(messageId)
		if err != nil {
			return nil, nil, nil, nil, err
		}

		provider, err = getStoreProvider(storeId)
	}

	if err != nil {
		return nil, nil, nil, nil, err
	}

	ttsProvider, err := provider.GetTextToSpeechProvider()
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
