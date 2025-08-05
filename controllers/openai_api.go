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
	"strings"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
	"github.com/sashabaranov/go-openai"
)

// ChatCompletions implements the OpenAI-compatible chat completions API
// @Title ChatCompletions
// @Tag OpenAI Compatible API
// @Description OpenAI compatible chat completions API
// @Param   body    body    openai.ChatCompletionRequest  true    "The OpenAI chat request"
// @Success 200 {object} openai.ChatCompletionResponse
// @router /api/chat/completions [post]
func (c *ApiController) ChatCompletions() {
	// Authenticate using API key
	apiKey := c.Ctx.Request.Header.Get("Authorization")
	if !strings.HasPrefix(apiKey, "Bearer ") {
		c.ResponseError("Invalid API key format. Expected 'Bearer API_KEY'")
		return
	}

	apiKey = strings.TrimPrefix(apiKey, "Bearer ")

	// Get the model provider based on API key
	modelProvider, err := object.GetModelProviderByProviderKey(apiKey)
	if err != nil {
		c.ResponseError(fmt.Sprintf("Authentication failed: %s", err.Error()))
		return
	}

	// Parse request body
	var request openai.ChatCompletionRequest
	err = json.Unmarshal(c.Ctx.Input.RequestBody, &request)
	if err != nil {
		c.ResponseError(fmt.Sprintf("Failed to parse request: %s", err.Error()))
		return
	}

	// Extract messages content
	var question string
	var systemPrompt string

	for _, msg := range request.Messages {
		if msg.Role == "system" {
			systemPrompt = msg.Content
		} else if msg.Role == "user" {
			// Keep the last user message
			question = msg.Content
		}
	}

	if question == "" {
		c.ResponseError("No user message found in the request")
		return
	}

	// Combine system prompt with user question if available
	if systemPrompt != "" {
		question = fmt.Sprintf("System: %s\n\nUser: %s", systemPrompt, question)
	}

	// Setup for streaming if enabled
	requestId := util.GenerateUUID()
	if request.Stream {
		c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
		c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
		c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")
	}

	// Create custom writer for OpenAI format
	writer := &OpenAIWriter{
		Response:  *c.Ctx.ResponseWriter, // Embed Response by dereferencing the pointer
		Buffer:    []byte{},
		RequestID: requestId,
		Stream:    request.Stream,
		Cleaner:   *NewCleaner(6),
		Model:     request.Model,
	}

	// Prepare empty history and knowledge for the model
	history := []*model.RawMessage{}
	knowledge := []*model.RawMessage{}

	// Call the model provider
	modelResult, err := modelProvider.QueryText(question, writer, history, "", knowledge, nil)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Handle response based on streaming mode
	if !request.Stream {
		// For non-streaming, send complete response at once
		answer := writer.MessageString()

		// Create response using go-openai structures
		response := openai.ChatCompletionResponse{
			ID:      "chatcmpl-" + requestId,
			Object:  "chat.completion",
			Created: util.GetCurrentUnixTime(),
			Model:   request.Model,
			Choices: []openai.ChatCompletionChoice{
				{
					Index: 0,
					Message: openai.ChatCompletionMessage{
						Role:    "assistant",
						Content: answer,
					},
					FinishReason: openai.FinishReasonStop,
				},
			},
			Usage: openai.Usage{
				PromptTokens:     modelResult.PromptTokenCount,
				CompletionTokens: modelResult.ResponseTokenCount,
				TotalTokens:      modelResult.TotalTokenCount,
			},
		}

		jsonResponse, err := json.Marshal(response)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.Ctx.Output.Header("Content-Type", "application/json")
		c.Ctx.Output.Body(jsonResponse)
	} else {
		// For streaming, close the stream with token counts
		err = writer.Close(
			modelResult.PromptTokenCount,
			modelResult.ResponseTokenCount,
			modelResult.TotalTokenCount,
		)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}
	c.EnableRender = false
}
