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

	"github.com/beego/beego/context"
	"github.com/casibase/casibase/util"
	"github.com/sashabaranov/go-openai"
)

// OpenAIWriter implements a writer that formats responses in OpenAI format
type OpenAIWriter struct {
	context.Response
	Cleaner    Cleaner
	Buffer     []byte
	RequestID  string
	Stream     bool
	StreamSent bool
	Model      string
}

// Write processes incoming data chunks and formats them for OpenAI compatibility
func (w *OpenAIWriter) Write(p []byte) (n int, err error) {
	// Append received data to buffer
	w.Buffer = append(w.Buffer, p...)

	// For non-streaming, just collect the data
	if !w.Stream {
		return len(p), nil
	}

	// For streaming, send data in OpenAI format
	cleanedData := w.Cleaner.CleanResponseChunk(string(p))
	if cleanedData == "" {
		return len(p), nil
	}

	// Create SSE chunk using go-openai library structure
	chunk := openai.ChatCompletionStreamResponse{
		ID:      "chatcmpl-" + w.RequestID,
		Object:  "chat.completion.chunk",
		Created: util.GetCurrentUnixTime(),
		Model:   w.Model,
		Choices: []openai.ChatCompletionStreamChoice{
			{
				Index: 0,
				Delta: openai.ChatCompletionStreamChoiceDelta{
					Content: cleanedData,
				},
			},
		},
	}

	jsonData, err := json.Marshal(chunk)
	if err != nil {
		return 0, err
	}

	// Send as SSE data chunk - use ResponseWriter to avoid recursion
	_, err = w.ResponseWriter.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonData)))
	if err != nil {
		return 0, err
	}

	w.StreamSent = true
	w.Flush()

	return len(p), nil
}

// MessageString returns the complete buffered message
func (w *OpenAIWriter) MessageString() string {
	return string(w.Buffer)
}

// Close finalizes the stream by sending completion message and DONE marker
func (w *OpenAIWriter) Close(inputTokens, outputTokens, totalTokens int) error {
	if w.Stream && w.StreamSent {
		// Send final message with finish_reason
		chunk := openai.ChatCompletionStreamResponse{
			ID:      "chatcmpl-" + w.RequestID,
			Object:  "chat.completion.chunk",
			Created: util.GetCurrentUnixTime(),
			Model:   w.Model,
			Choices: []openai.ChatCompletionStreamChoice{
				{
					Index: 0,
					Delta: openai.ChatCompletionStreamChoiceDelta{},
				},
			},
		}

		jsonData, err := json.Marshal(chunk)
		if err != nil {
			return err
		}

		_, err = w.ResponseWriter.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonData)))
		if err != nil {
			return err
		}

		// Final [DONE] marker for SSE
		_, err = w.ResponseWriter.Write([]byte("data: [DONE]\n\n"))
		if err != nil {
			return err
		}

		w.Flush()
	}

	return nil
}
