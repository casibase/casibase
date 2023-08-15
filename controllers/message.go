// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"strings"

	"github.com/casbin/casibase/ai"
	"github.com/casbin/casibase/object"
	"github.com/casbin/casibase/util"
)

func (c *ApiController) GetGlobalMessages() {
	messages, err := object.GetGlobalMessages()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

func (c *ApiController) GetMessages() {
	owner := "admin"
	chat := c.Input().Get("chat")

	if chat == "" {
		messages, err := object.GetMessages(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		c.ResponseOk(messages)
		return
	}

	messages, err := object.GetChatMessages(chat)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(messages)
}

func (c *ApiController) GetMessage() {
	id := c.Input().Get("id")

	message, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(message)
}

func (c *ApiController) ResponseErrorStream(errorText string) {
	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", errorText)
	_, err := c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func getModelProviderFromContext(owner string, name string) (*object.Provider, error) {
	var providerName string
	if name != "" {
		providerName = name
	} else {
		store, err := object.GetDefaultStore(owner)
		if err != nil {
			return nil, err
		}

		if store.ModelProvider != "" {
			providerName = store.ModelProvider
		}
	}

	var provider *object.Provider
	var err error
	if providerName != "" {
		providerId := util.GetIdFromOwnerAndName(owner, providerName)
		provider, err = object.GetProvider(providerId)
	} else {
		provider, err = object.GetDefaultModelProvider()
	}

	if provider == nil && err == nil {
		return nil, fmt.Errorf("The provider: %s is not found", providerName)
	} else {
		return provider, err
	}
}

func (c *ApiController) GetMessageAnswer() {
	id := c.Input().Get("id")

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	message, err := object.GetMessage(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if message == nil {
		c.ResponseErrorStream(fmt.Sprintf("The message: %s is not found", id))
		return
	}

	if message.Author != "AI" || message.ReplyTo == "" || message.Text != "" {
		c.ResponseErrorStream("The message is invalid")
		return
	}

	chatId := util.GetIdFromOwnerAndName("admin", message.Chat)
	chat, err := object.GetChat(chatId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	//if chat == nil || chat.Organization != message.Organization {
	//	c.ResponseErrorStream(fmt.Sprintf("The chat: %s is not found", chatId))
	//	return
	//}

	if chat.Type != "AI" {
		c.ResponseErrorStream("The chat type must be \"AI\"")
		return
	}

	questionMessage, err := object.GetMessage(message.ReplyTo)
	if questionMessage == nil {
		c.ResponseErrorStream(fmt.Sprintf("The message: %s is not found", id))
		return
	}

	provider, err := getModelProviderFromContext(chat.Owner, chat.User2)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if provider.Category != "Model" || provider.ClientSecret == "" {
		c.ResponseErrorStream(fmt.Sprintf("The provider: %s is invalid", provider.GetId()))
		return
	}

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	authToken := provider.ClientSecret
	question := questionMessage.Text
	var stringBuilder strings.Builder

	nearestText, err := object.GetNearestVectorText(authToken, chat.Owner, question)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	realQuestion := ai.GetQuestionWithKnowledge(nearestText, question)

	fmt.Printf("Question: [%s]\n", question)
	fmt.Printf("Context: [%s]\n", nearestText)
	fmt.Printf("Answer: [")

	err = ai.QueryAnswerStream(authToken, realQuestion, c.Ctx.ResponseWriter, &stringBuilder)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	fmt.Printf("]\n")

	event := fmt.Sprintf("event: end\ndata: %s\n\n", "end")
	_, err = c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	answer := stringBuilder.String()

	message.Text = answer
	_, err = object.UpdateMessage(message.GetId(), message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func (c *ApiController) UpdateMessage() {
	id := c.Input().Get("id")

	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateMessage(id, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	var chat *object.Chat
	if message.Chat != "" {
		chatId := util.GetId("admin", message.Chat)
		chat, err = object.GetChat(chatId)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		if chat == nil {
			c.ResponseError(fmt.Sprintf("chat:The chat: %s is not found", chatId))
			return
		}
	}

	success, err := object.AddMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if success {
		if chat != nil && chat.Type == "AI" {
			answerMessage := &object.Message{
				Owner:       message.Owner,
				Name:        fmt.Sprintf("message_%s", util.GetRandomName()),
				CreatedTime: util.GetCurrentTimeEx(message.CreatedTime),
				// Organization: message.Organization,
				Chat:    message.Chat,
				ReplyTo: message.GetId(),
				Author:  "AI",
				Text:    "",
			}
			_, err = object.AddMessage(answerMessage)
			if err != nil {
				c.ResponseError(err.Error())
				return
			}
		}
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteMessage() {
	var message object.Message
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteMessage(&message)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
