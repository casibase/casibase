// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package controllers

import (
	"context"
	"fmt"

	"github.com/casibase/casibase/object"
)

// ProcessSpeechToText
// @Title ProcessSpeechToText
// @Tag STT API
// @Description convert speech to text
// @Param audio formData file true "The audio file to convert to text"
// @Param storeId formData string true "The store ID"
// @Success 200 {object} controllers.SpeechToTextResponse The transcribed text
// @router /process-speech-to-text [post]
func (c *ApiController) ProcessSpeechToText() {
	// Get parameters from form data
	storeId := c.GetString("storeId")
	if storeId == "" {
		c.ResponseError("Missing required parameter: storeId")
		return
	}

	// Get the audio audioFile from the request
	audioFile, _, err := c.GetFile("audio")
	if err != nil {
		c.ResponseError(fmt.Sprintf("Error getting audio audioFile: %s", err.Error()))
		return
	}
	defer audioFile.Close()

	store, err := object.GetStore(storeId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if store == nil {
		c.ResponseError(fmt.Sprintf("The store: %s is not found", storeId))
		return
	}

	// Get STT provider
	provider, err := store.GetSpeechToTextProvider()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if provider == nil {
		c.ResponseError(fmt.Sprintf("The speech-to-text provider for store: %s is not found", store.GetId()))
		return
	}

	// Get provider implementation
	providerObj, err := provider.GetSpeechToTextProvider()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	// Process the audio data and get the transcription
	ctx := context.Background()
	text, _, err := providerObj.ProcessAudio(audioFile, ctx)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Return the transcribed text
	c.ResponseOk(text)
}
