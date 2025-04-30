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
	"encoding/json"
	"fmt"

	"github.com/casibase/casibase/object"
)

type TextToSpeechRequest struct {
	StoreId    string `json:"storeId"`
	ProviderId string `json:"providerId"`
	MessageId  string `json:"messageId"`
	Text       string `json:"text"`
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
	message, chat, providerObj, ctx, err := object.PrepareTextToSpeech(req.StoreId, req.ProviderId, req.MessageId, req.Text)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	audioData, ttsResult, err := providerObj.QueryAudio(message.Text, ctx)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if audioData == nil {
		c.ResponseError("The audio data is nil")
		return
	}

	err = object.UpdateChatStats(chat, ttsResult)
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

	message, chat, providerObj, ctx, err := object.PrepareTextToSpeech(storeId, "", messageId, "")
	if err != nil {
		c.ResponseErrorStream(message, err.Error())
		return
	}

	ttsResult, err := providerObj.QueryAudioStream(message.Text, ctx, c.Ctx.ResponseWriter)
	if err != nil {
		c.ResponseErrorStream(message, err.Error())
		return
	}

	err = object.UpdateChatStats(chat, ttsResult)
	if err != nil {
		fmt.Printf("Error updating chat: %s\n", err.Error())
	}
}
