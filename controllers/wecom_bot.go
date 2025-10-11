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

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/workweixin/weworkapi_golang/json_callback/wxbizjsonmsgcrypt"
)

// WecomBotVerifyUrl verify WeChat work bot callback URL
// @Title WecomBotVerifyUrl
// @Tag WechatWork Bot API
// @Description verify WeChat work bot callback URL
// @router /api/wecom-bot/callback/:botId [get]
func (c *ApiController) WecomBotVerifyUrl() {
	botId := c.Ctx.Input.Param(":botId")
	msgSignature := c.GetString("msg_signature")
	timestamp := c.GetString("timestamp")
	nonce := c.GetString("nonce")
	echoStr := c.GetString("echostr")
	logs.Debug("botID: %s, msgSignature: %s, timestamp: %s, nonce: %s, echoStr: %s", botId, msgSignature, timestamp, nonce, echoStr)

	token, encodingAESKey, err := object.GetWecomBotTokenAndKey(botId)
	if err != nil {
		c.Ctx.ResponseWriter.Write([]byte(fmt.Sprintf("verify fail: %v", err)))
		return
	}

	wxcpt := wxbizjsonmsgcrypt.NewWXBizMsgCrypt(token, encodingAESKey, "", wxbizjsonmsgcrypt.JsonType)

	result, cryptErr := wxcpt.VerifyURL(msgSignature, timestamp, nonce, echoStr)
	if cryptErr != nil {
		c.Ctx.ResponseWriter.Write([]byte(fmt.Sprintf("verify fail: %v", cryptErr)))
		return
	}

	logs.Debug("[WechatWork Bot] URL verified for botID: %s\n", botId)
	c.Ctx.ResponseWriter.Write(result)
}

// WecomBotHandleMessage process WeChat work bot messages
// @Title WecomBotHandleMessage
// @Tag WechatWork Bot API
// @Description handle WeChat work bot messages
// @router /api/wecom-bot/callback/:botId [post]
func (c *ApiController) WecomBotHandleMessage() {
	botId := c.Ctx.Input.Param(":botId")
	msgSignature := c.GetString("msg_signature")
	timestamp := c.GetString("timestamp")
	nonce := c.GetString("nonce")

	token, encodingAESKey, err := object.GetWecomBotTokenAndKey(botId)
	if err != nil {
		logs.Error("verify fail: %v", err)
		c.Ctx.ResponseWriter.Write([]byte(fmt.Sprintf("verify fail: %v", err)))
		return
	}

	wxcpt := wxbizjsonmsgcrypt.NewWXBizMsgCrypt(token, encodingAESKey, "", wxbizjsonmsgcrypt.JsonType)

	postData := c.Ctx.Input.RequestBody
	plaintext, cryptErr := wxcpt.DecryptMsg(msgSignature, timestamp, nonce, postData)
	if cryptErr != nil {
		logs.Error("[WechatWork Bot] Decrypt message error: %v\n", cryptErr)
		c.Ctx.ResponseWriter.Write([]byte("error"))
		return
	}

	var message object.WecomBotMessage
	if err := json.Unmarshal(plaintext, &message); err != nil {
		logs.Error("[WechatWork Bot] Parse message error: %v\n", err)
		c.Ctx.ResponseWriter.Write([]byte("error"))
		return
	}

	logs.Debug("[WechatWork Bot] Received message, botID: %s, msgtype: %s, msgid: %s\n", botId, message.MsgType, message.MsgId)

	var responseMsg string
	switch message.MsgType {
	case "text":
		responseMsg, cryptErr = c.handleTextMessage(&message, wxcpt, nonce, timestamp)
	default:
		logs.Debug("[WechatWork Bot] Unsupported message type: %s\n", message.MsgType)
		c.Ctx.ResponseWriter.Write([]byte("success"))
		return
	}

	if cryptErr != nil {
		logs.Error("[WechatWork Bot] Handle message error: %v\n", cryptErr)
		c.Ctx.ResponseWriter.Write([]byte("error"))
		return
	}

	c.Ctx.ResponseWriter.Write([]byte(responseMsg))
}

func (c *ApiController) handleTextMessage(message *object.WecomBotMessage, wxcpt *wxbizjsonmsgcrypt.WXBizMsgCrypt, nonce, timestamp string) (string, *wxbizjsonmsgcrypt.CryptError) {
	if message.Text == nil {
		return "", wxbizjsonmsgcrypt.NewCryptError(wxbizjsonmsgcrypt.ParseJsonError, "text content is empty")
	}

	content := message.Text.Content
	logs.Debug("[WechatWork Bot] Text message from %s: %s\n", message.From.UserId, content)

	store, err := object.GetDefaultStore("admin")
	if err != nil {
		return "", wxbizjsonmsgcrypt.NewCryptError(wxbizjsonmsgcrypt.IllegalBuffer, fmt.Sprintf("get default store error: %v", err))
	}
	answer, err := sendMessage(store, content)
	if err != nil {
		return "", wxbizjsonmsgcrypt.NewCryptError(wxbizjsonmsgcrypt.IllegalBuffer, fmt.Sprintf("send message error: %v", err))
	}
	logs.Debug("[WechatWork Bot] AI response: %s\n", answer)

	resp, err := object.MakeTextResponse(answer)
	if err != nil {
		return "", wxbizjsonmsgcrypt.NewCryptError(wxbizjsonmsgcrypt.GenJsonError, err.Error())
	}

	encryptedMsg, cryptErr := wxcpt.EncryptMsg(resp, timestamp, nonce)
	if cryptErr != nil {
		return "", cryptErr
	}

	return string(encryptedMsg), nil
}

func sendMessage(store *object.Store, question string) (string, error) {
	modelProvider, _, err := object.GetModelProviderFromContext("admin", store.ModelProvider)
	if err != nil {
		return "", err
	}

	embeddingProvider, embeddingProviderObj, err := object.GetEmbeddingProviderFromContext("admin", store.EmbeddingProvider)
	if err != nil {
		return "", err
	}

	knowledge, _, _, err := object.GetNearestKnowledge(store.Name, store.SearchProvider, embeddingProvider, embeddingProviderObj, modelProvider, "admin", question, store.KnowledgeCount)
	if err != nil {
		return "", err
	}
	var history []*model.RawMessage
	answer, _, err := object.GetAnswerWithContext(store.ModelProvider, question, history, knowledge, store.Prompt)
	if err != nil {
		return "", err
	}
	return answer, nil
}
