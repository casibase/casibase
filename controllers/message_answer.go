// Copyright 2024 The casbin Authors. All Rights Reserved.
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
	"fmt"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

func (c *ApiController) GetMessageAnswer() {
	id := c.Input().Get("id")

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	message, err := object.GetMessage(id)
	if err != nil {
		c.ResponseErrorStream(err.Error())
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

	chatId := util.GetIdFromOwnerAndName(message.Owner, message.Chat)
	chat, err := object.GetChat(chatId)
	if err != nil {
		c.ResponseErrorStream(err.Error())
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

	store, err := object.GetDefaultStore("admin")
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}
	if store == nil {
		c.ResponseErrorStream(fmt.Sprintf("The default store is not found"))
		return
	}

	question := store.Welcome
	var questionMessage *object.Message
	if message.ReplyTo != "Welcome" {
		questionMessage, err = object.GetMessage(util.GetId("admin", message.ReplyTo))
		if err != nil {
			c.ResponseErrorStream(err.Error())
			return
		}
		if questionMessage == nil {
			c.ResponseErrorStream(fmt.Sprintf("The message: %s is not found", id))
			return
		}

		question = questionMessage.Text
	}

	if question == "" {
		c.ResponseErrorStream(fmt.Sprintf("The question should not be empty"))
		return
	}

	_, ok := c.CheckSignedIn()
	if !ok {
		var count int
		count, err = object.GetNearMessageCount(message.User, store.LimitMinutes)
		if err != nil {
			c.ResponseErrorStream(err.Error())
			return
		}
		if count > store.Frequency {
			c.ResponseErrorStream("You have queried too many times, please wait for a while")
			return
		}
	}

	_, modelProviderObj, err := object.GetModelProviderFromContext("admin", chat.User2)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	embeddingProvider, embeddingProviderObj, err := object.GetEmbeddingProviderFromContext("admin", chat.User2)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	knowledge, vectorScores, embeddingResult, err := object.GetNearestKnowledge(embeddingProvider, embeddingProviderObj, "admin", question)
	if err != nil && err.Error() != "no knowledge vectors found" {
		c.ResponseErrorStream(err.Error())
		return
	}

	if questionMessage != nil {
		questionMessage.TokenCount = embeddingResult.TokenCount
		questionMessage.Price = embeddingResult.Price
		questionMessage.Currency = embeddingResult.Currency

		_, err = object.UpdateMessage(questionMessage.GetId(), questionMessage)
		if err != nil {
			c.ResponseErrorStream(err.Error())
			return
		}
	}

	writer := &RefinedWriter{*c.Ctx.ResponseWriter, *NewCleaner(6), []byte{}}
	history, err := object.GetRecentRawMessages(chat.Name, message.CreatedTime, store.MemoryLimit)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	fmt.Printf("Question: [%s]\n", question)
	fmt.Printf("Knowledge: [\n")
	for i, k := range knowledge {
		fmt.Printf("Knowledge %d: [%s]\n", i, k.Text)
	}
	fmt.Printf("]\n")
	// fmt.Printf("Refined Question: [%s]\n", realQuestion)
	fmt.Printf("Answer: [")

	modelResult, err := modelProviderObj.QueryText(question, writer, history, store.Prompt, knowledge)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	if writer.writerCleaner.cleaned == false {
		cleanedData := writer.writerCleaner.GetCleanedData()
		writer.buf = append(writer.buf, []byte(cleanedData)...)
		jsonData, err := ConvertMessageDataToJSON(cleanedData)
		if err != nil {
			c.ResponseErrorStream(err.Error())
			return
		}

		_, err = writer.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", jsonData)))
		if err != nil {
			c.ResponseErrorStream(err.Error())
			return
		}

		writer.Flush()
		fmt.Print(cleanedData)
	}

	fmt.Printf("]\n")

	event := fmt.Sprintf("event: end\ndata: %s\n\n", "end")
	_, err = c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	answer := writer.String()

	message.TokenCount = modelResult.TotalTokenCount
	message.Price = modelResult.TotalPrice
	message.Currency = modelResult.Currency

	message.Text = answer
	message.VectorScores = vectorScores
	_, err = object.UpdateMessage(message.GetId(), message)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}

	chat.TokenCount += message.TokenCount
	chat.Price += message.Price
	if chat.Currency == "" {
		chat.Currency = message.Currency
	}

	if questionMessage != nil {
		if chat.Currency == questionMessage.Currency {
			chat.TokenCount += questionMessage.TokenCount
			chat.Price += questionMessage.Price
		}
	}

	_, err = object.UpdateChat(chat.GetId(), chat)
	if err != nil {
		c.ResponseErrorStream(err.Error())
		return
	}
}

func (c *ApiController) GetAnswer() {
	provider := c.Input().Get("provider")
	question := c.Input().Get("question")

	answer, err := object.GetAnswer(provider, question)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(answer)
}
