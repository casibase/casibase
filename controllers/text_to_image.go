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

	"github.com/casibase/casibase/object"
)

type TextToImageRequest struct {
	StoreId    string `json:"storeId"`
	ProviderId string `json:"providerId"`
	MessageId  string `json:"messageId"`
	Text       string `json:"text"`
}

// GenerateTextToImage
// @Title GenerateTextToImage
// @Tag Image API
// @Description convert text to image
// @Param body controllers.TextToImageRequest true "The text to convert to image"
// @Success 200 {object} string "The image HTML"
// @router /generate-text-to-image [post]
func (c *ApiController) GenerateTextToImage() {
	var req TextToImageRequest
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &req)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	_, chat, providerObj, _, err := object.PrepareTextToImage(req.StoreId, req.ProviderId, req.MessageId, req.Text, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	result, err := providerObj.QueryImage(req.Text, c.Ctx.ResponseWriter, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	err = object.UpdateChatStatsForImage(chat, result)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}
