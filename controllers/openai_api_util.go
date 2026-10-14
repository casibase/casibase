// Copyright 2025 The OpenAgent Authors. All Rights Reserved.
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

	"github.com/beego/beego/context"
	"github.com/sashabaranov/go-openai"
	"github.com/the-open-agent/openagent/i18n"
	"github.com/the-open-agent/openagent/model"
	"github.com/the-open-agent/openagent/object"
	"github.com/the-open-agent/openagent/util"
)

// parseOpenAIMessages splits a messages slice into question, system prompt, and prior history.
// History excludes the final user message, which is returned separately as question.
func parseOpenAIMessages(messages []openai.ChatCompletionMessage) (question, systemPrompt string, history []*model.RawMessage, err error) {
	for _, msg := range messages {
		switch msg.Role {
		case "system":
			systemPrompt = msg.Content
		case "user":
			question = msg.Content
			history = append(history, &model.RawMessage{Author: "Human", Text: msg.Content})
		case "assistant":
			history = append(history, &model.RawMessage{Author: "AI", Text: msg.Content})
		}
	}
	if question == "" {
		return "", "", nil, fmt.Errorf("no user message found in the request")
	}
	// Drop the last entry (the final user message) — it's passed as question to QueryText
	if len(history) > 0 {
		history = history[:len(history)-1]
	}
	return question, systemPrompt, history, nil
}

// getApiKnowledge searches the agent's knowledge base for the question like a chat in the web UI does,
// and records the embedding cost on the question message. Without an embedding model it answers without knowledge.
func getApiKnowledge(store *object.Store, modelProvider *object.Provider, questionMsg *object.Message, question string, lang string) ([]*model.RawMessage, []object.VectorScore, error) {
	if store.KnowledgeCount == 0 {
		return nil, nil, nil
	}

	embeddingProvider, embeddingProviderObj, err := object.GetEmbeddingProviderFromContext(store.Owner, "", lang)
	if err != nil || embeddingProviderObj == nil {
		return nil, nil, nil
	}

	knowledge, vectorScores, embeddingResult, err := object.GetNearestKnowledge(store.Name, store.VectorStores, store.SearchProvider, embeddingProvider, embeddingProviderObj, modelProvider, store.Owner, question, store.KnowledgeCount, lang)
	if err != nil && err.Error() != "no knowledge vectors found" {
		return nil, nil, fmt.Errorf(i18n.Translate(lang, "message_answer:object.GetNearestKnowledge() error, %s"), err.Error())
	}

	if embeddingResult != nil {
		questionMsg.TokenCount = embeddingResult.TokenCount
		questionMsg.Price = embeddingResult.Price
		questionMsg.Currency = embeddingResult.Currency
		if embeddingResult.Data != nil {
			questionMsg.Data = embeddingResult.Data
		}
		if _, err = object.UpdateMessage(questionMsg.GetId(), questionMsg, false); err != nil {
			return nil, nil, err
		}
	}

	return knowledge, vectorScores, nil
}

// newOpenAIWriter sets streaming headers when needed and returns a configured OpenAIWriter.
func newOpenAIWriter(rw *context.Response, request openai.ChatCompletionRequest, requestId string) *OpenAIWriter {
	if request.Stream {
		rw.Header().Set("Content-Type", "text/event-stream")
		rw.Header().Set("Cache-Control", "no-cache")
		rw.Header().Set("Connection", "keep-alive")
	}
	return &OpenAIWriter{
		Response:  *rw,
		Buffer:    []byte{},
		RequestID: requestId,
		Stream:    request.Stream,
		Cleaner:   *NewCleaner(6),
		Model:     request.Model,
	}
}

// createApiChatSession inserts a Chat, a user Message, and a placeholder AI Message into the DB.
func createApiChatSession(store *object.Store, modelProviderName, question string) (*object.Chat, *object.Message, *object.Message, error) {
	now := util.GetCurrentTime()
	userMessageTime := util.GetCurrentTimeWithMilli()

	chat := &object.Chat{
		Owner:         store.Owner,
		Name:          fmt.Sprintf("chat_%s", util.GetRandomName()),
		CreatedTime:   now,
		UpdatedTime:   now,
		Store:         store.Name,
		ModelProvider: modelProviderName,
		Source:        object.ChatSourceOpenAICompatibleAPI,
		User:          "api",
	}
	if _, err := object.AddChat(chat); err != nil {
		return nil, nil, nil, err
	}

	userMsg := &object.Message{
		Owner:         store.Owner,
		Name:          fmt.Sprintf("message_%s", util.GetRandomName()),
		CreatedTime:   userMessageTime,
		Store:         store.Name,
		Chat:          chat.Name,
		Author:        "Human",
		Text:          question,
		ModelProvider: modelProviderName,
		User:          "api",
	}
	if _, err := object.AddMessage(userMsg); err != nil {
		return nil, nil, nil, err
	}

	aiMsg := &object.Message{
		Owner:         store.Owner,
		Name:          fmt.Sprintf("message_%s", util.GetRandomName()),
		CreatedTime:   util.GetCurrentTimeBasedOnLastMilli(userMessageTime),
		Store:         store.Name,
		Chat:          chat.Name,
		Author:        "AI",
		ReplyTo:       userMsg.Name,
		ModelProvider: modelProviderName,
		User:          "api",
	}
	if _, err := object.AddMessage(aiMsg); err != nil {
		return nil, nil, nil, err
	}

	return chat, userMsg, aiMsg, nil
}

// applyResultToApiSession writes the AI answer and token counts back to the DB.
func applyResultToApiSession(aiMsg *object.Message, chat *object.Chat, writer *OpenAIWriter, modelResult *model.ModelResult) error {
	aiMsg.Text = writer.MessageString()
	aiMsg.ToolCalls = model.GetToolCallsFromWriter(writer.ToolString())
	aiMsg.TokenCount = modelResult.TotalTokenCount
	aiMsg.Price = modelResult.TotalPrice
	aiMsg.Currency = modelResult.Currency
	if _, err := object.UpdateMessage(aiMsg.GetId(), aiMsg, false); err != nil {
		return err
	}

	latestChat, err := object.GetChat(chat.GetId())
	if err != nil {
		return err
	}
	if latestChat == nil {
		return fmt.Errorf("chat not found: %s", chat.GetId())
	}

	latestChat.TokenCount += modelResult.TotalTokenCount
	latestChat.Price += modelResult.TotalPrice
	if latestChat.Currency == "" {
		latestChat.Currency = modelResult.Currency
	}
	_, err = object.UpdateChat(latestChat.GetId(), latestChat)
	return err
}
