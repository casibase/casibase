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

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

type TextToSpeechRequest struct {
	StoreId   string `json:"storeId"`
	MessageId string `json:"messageId"`
}

// GetTextToSpeechAudio
// @Title GetTextToSpeechAudio
// @Tag TTS API
// @Description convert text to speech
// @Param body body controllers.TextToSpeechRequest true "The text to convert to speech"
// @Success 200 {object} []byte The audio data
// @router /get-text-to-speech-audio [post]
func (c *ApiController) GetTextToSpeechAudio() {
	var req TextToSpeechRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	store, err := object.GetStore(req.StoreId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ttsProvider, err := store.GetTTSProvider()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ttsProviderObj, err := ttsProvider.GetTextToSpeechProvider()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	message, err := object.GetMessage(req.MessageId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	ctx := context.Background()
	audioData, ttsResult, err := ttsProviderObj.QueryAudio(message.Text, ctx)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := object.GetChat(chatId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	chat.TokenCount += ttsResult.TokenCount
	chat.Price += ttsResult.Price
	if chat.Currency == "" {
		chat.Currency = ttsResult.Currency
	}

	chat.UpdatedTime = util.GetCurrentTime()

	_, err = object.UpdateChat(chat.GetId(), chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseAudio(audioData, "audio/mp3", "speech.mp3")
}
