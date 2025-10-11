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
	"encoding/json"
	"fmt"
)

var (
	WecomBotCache        = make(map[string]Provider)
	WecomBotMessageCache = make(map[string]string)
)

type WecomBotMessage struct {
	MsgId    string        `json:"msgid"`
	AIBotId  string        `json:"aibotid"`
	ChatId   string        `json:"chatid,omitempty"`
	ChatType string        `json:"chattype"`
	From     *FromUser     `json:"from"`
	MsgType  string        `json:"msgtype"`
	Text     *TextMessage  `json:"text,omitempty"`
	Image    *ImageMessage `json:"image,omitempty"`
	Stream   *StreamRecv   `json:"stream,omitempty"`
}

type FromUser struct {
	UserId string `json:"userid"`
}

type TextMessage struct {
	Content string `json:"content"`
}

type ImageMessage struct {
	Url string `json:"url"`
}

type StreamRecv struct {
	Id string `json:"id"`
}

type StreamResponse struct {
	MsgType string      `json:"msgtype"`
	Stream  *StreamSend `json:"stream"`
}

type StreamSend struct {
	ID      string    `json:"id,omitempty"`
	Finish  bool      `json:"finish"`
	Content string    `json:"content,omitempty"`
	MsgItem []MsgItem `json:"msg_item,omitempty"`
}

type MsgItem struct {
	MsgType string     `json:"msgtype"`
	Image   *ImageItem `json:"image,omitempty"`
}

type ImageItem struct {
	Base64 string `json:"base64"`
	Md5    string `json:"md5"`
}

type MsgResponse struct {
	MsgType string      `json:"msgtype"`
	Stream  *StreamSend `json:"stream"`
}

func GetWecomBotTokenAndKey(botID string) (string, string, error) {
	p, ok := WecomBotCache[botID]
	if ok {
		return p.ClientSecret, p.Region, nil
	}

	providers, err := GetProviders("admin")
	if err != nil {
		return "", "", err
	}
	for _, provider := range providers {
		if provider.Type == "Tencent" && provider.SubType == "WeCom Bot" && provider.ClientId == botID {
			WecomBotCache[botID] = *provider
			return provider.ClientSecret, provider.Region, nil
		}
	}
	return "", "", fmt.Errorf("not found provider for bot %s", botID)
}

func MakeMsgResponse(content string, streamId string) (string, error) {
	msg := MsgResponse{
		MsgType: "stream",
		Stream: &StreamSend{
			ID:      streamId,
			Finish:  content != "",
			Content: content,
		},
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return "", err
	}

	return string(data), nil
}
