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

//go:build !skipCi
// +build !skipCi

package object

import (
	"fmt"
	"testing"

	"github.com/casibase/casibase/embedding"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/util"
)

func TestUpdateMessages(t *testing.T) {
	InitConfig()

	store, err := GetDefaultStore("admin")
	if err != nil {
		panic(err)
	}

	allMessages, err := GetGlobalMessages()
	if err != nil {
		panic(err)
	}

	modelSubType := "gpt-4-vision-preview"
	maxTokens := model.GetOpenAiMaxTokens(modelSubType)

	for i, message := range allMessages {
		if message.Text == "" || (message.TokenCount != 0 && message.Price != 0) {
			continue
		}

		if message.Author != "AI" {
			defaultEmbeddingResult, err := embedding.GetDefaultEmbeddingResult("text-embedding-ada-002", message.Text)
			if err != nil {
				panic(err)
			}

			message.TokenCount = defaultEmbeddingResult.TokenCount
			message.Price = defaultEmbeddingResult.Price
			message.Currency = defaultEmbeddingResult.Currency

			_, err = UpdateMessage(message.GetId(), message)
			if err != nil {
				panic(err)
			}
		} else {
			question := store.Welcome
			if message.ReplyTo != "Welcome" {
				questionMessage, err := GetMessage(util.GetId("admin", message.ReplyTo))
				if err != nil {
					panic(err)
				}

				question = questionMessage.Text
			}

			history, err := GetRecentRawMessages(message.Chat, message.CreatedTime, store.MemoryLimit)
			if err != nil {
				panic(err)
			}

			prompt := store.Prompt
			knowledge := []*model.RawMessage{}

			rawMessages, err := model.OpenaiGenerateMessages(prompt, question, history, knowledge, modelSubType, maxTokens)
			if err != nil {
				panic(err)
			}

			messages, err := model.OpenaiRawMessagesToGpt4VisionMessages(rawMessages)
			if err != nil {
				panic(err)
			}

			// https://github.com/sashabaranov/go-openai/pull/223#issuecomment-1494372875
			promptTokenCount, err := model.OpenaiNumTokensFromMessages(messages, modelSubType)
			if err != nil {
				panic(err)
			}

			responseTokenCount, err := model.GetTokenSize(modelSubType, message.Text)
			if err != nil {
				panic(err)
			}

			modelResult := &model.ModelResult{}
			modelResult.PromptTokenCount = promptTokenCount
			modelResult.ResponseTokenCount = responseTokenCount
			modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

			p, err := model.NewLocalModelProvider("", modelSubType, "", 0, 0, 0, 0, "")
			err = p.CalculatePrice(modelResult)
			if err != nil {
				panic(err)
			}

			message.TokenCount = modelResult.TotalTokenCount
			message.Price = modelResult.TotalPrice
			message.Currency = modelResult.Currency

			fmt.Printf("[%d/%d] message: %s, user: %s, author: %s, tokenCount: %d, price: %f\n", i+1, len(allMessages), message.Name, message.User, message.Author, message.TokenCount, message.Price)

			_, err = UpdateMessage(message.GetId(), message)
			if err != nil {
				panic(err)
			}
		}
	}
}

func TestUpdateMessagesAndChats(t *testing.T) {
	TestUpdateMessages(t)
	TestUpdateMessageCounts(t)
	TestUpdateMessageTokens(t)
}
