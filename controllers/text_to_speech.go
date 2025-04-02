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

package controllers

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/tts"
	"github.com/casibase/casibase/util"
)

type TextToSpeechRequest struct {
	StoreId   string `json:"storeId"`
	MessageId string `json:"messageId"`
}

// prepareTextToSpeech prepares the text-to-speech conversion
func (c *ApiController) prepareTextToSpeech(storeId, messageId string) (*object.Message, *object.Chat, *object.Store, tts.TextToSpeechProvider, context.Context, error) {
	message, err := object.GetMessage(messageId)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if message == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The message: %s is not found", messageId)
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := object.GetChat(chatId)
	if err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if chat == nil {
		return nil, nil, nil, nil, nil, fmt.Errorf("The chat: %s is not found", chatId)
	}

	store, err := object.GetStore(storeId)
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

func (c *ApiController) updateChatStats(chat *object.Chat, ttsResult *tts.TextToSpeechResult) error {
	chat.TokenCount += ttsResult.TokenCount
	chat.Price += ttsResult.Price
	if chat.Currency == "" {
		chat.Currency = ttsResult.Currency
	}

	chat.UpdatedTime = util.GetCurrentTime()
	_, err := object.UpdateChat(chat.GetId(), chat)
	return err
}

// GenerateTextToSpeechAudio
// @Title GenerateTextToSpeechAudio
// @Tag TTS API
// @Description convert text to speech
// @Param body controllers.TextToSpeechRequest true "The text to convert to speech"
// @Success 200 {object} []byte The audio data
// @router /generate-text-to-speech-audio [post]
func (c *ApiController) GenerateTextToSpeechAudio() {
	var req TextToSpeechRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	message, chat, _, providerObj, ctx, err := c.prepareTextToSpeech(req.StoreId, req.MessageId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	audioData, ttsResult, err := providerObj.QueryAudio(message.Text, ctx, tts.ModeBuffer, nil)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if audioData == nil {
		c.ResponseError("The audio data is nil")
		return
	}

	err = c.updateChatStats(chat, ttsResult)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseAudio(audioData, "audio/mp3", "speech.mp3")
}

// GenerateTextToSpeechAudioStream
// @Title GenerateTextToSpeechAudioStream
// @Tag TTS API
// @Description convert text to speech with streaming
// @Param storeId query string true "The store ID"
// @Param messageId query string true "The message ID"
// @Success 200 {stream} string "An event stream of audio chunks in base64 format"
// @router /generate-text-to-speech-audio-stream [get]
func (c *ApiController) GenerateTextToSpeechAudioStream() {
	storeId := c.Input().Get("storeId")
	messageId := c.Input().Get("messageId")

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	message, chat, _, providerObj, ctx, err := c.prepareTextToSpeech(storeId, messageId)
	if err != nil {
		c.ResponseErrorStream(message, err.Error())
		return
	}

	_, ttsResult, err := providerObj.QueryAudio(message.Text, ctx, tts.ModeStream, c.Ctx.ResponseWriter)
	if err != nil {
		c.ResponseErrorStream(message, err.Error())
		return
	}

	err = c.updateChatStats(chat, ttsResult)
	if err != nil {
		fmt.Printf("Error updating chat: %s\n", err.Error())
	}
}
