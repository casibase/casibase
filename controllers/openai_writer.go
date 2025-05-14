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
	context.Response // Embed Response instead of having ResponseWriter as a field
	Buffer           []byte
	RequestID        string
	Stream           bool
	StreamSent       bool
	Cleaner          Cleaner
	Model            string
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

	// Send as SSE data chunk - use Write directly on the embedded Response
	_, err = w.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonData)))
	if err != nil {
		return 0, err
	}

	w.StreamSent = true
	w.Flush() // Call Flush directly on the embedded Response

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

		_, err = w.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonData)))
		if err != nil {
			return err
		}

		// Final [DONE] marker for SSE
		_, err = w.Write([]byte("data: [DONE]\n\n"))
		if err != nil {
			return err
		}

		w.Flush()
	}

	return nil
}
