package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
	"github.com/sashabaranov/go-openai"
)

// @Title OpenAICompatibleChat
// @Tag OpenAI Compatible API
// @Description OpenAI compatible chat completion API
// @Param   store     path    string  true        "The store name"
// @Param   body      body    openai.ChatCompletionRequest  true    "The chat request body"
// @Success 200 {stream} openai.ChatCompletionResponse "A stream of chat completion responses"
// @router /api/openai/:store/v1/chat/completions [post,options]
func (c *ApiController) OpenAICompatibleChat() {
	// check store
	storeName := c.Ctx.Input.Param(":store")
	if storeName == "" {
		c.ResponseErrorStream(nil, "Store name is required")
		return
	}

	// check request
	var req openai.ChatCompletionRequest
	err := json.NewDecoder(c.Ctx.Request.Body).Decode(&req)
	if err != nil {
		c.ResponseErrorStream(nil, "Invalid request body")
		return
	}

	// get store
	store, err := object.GetStore(util.GetId("admin", storeName))
	if err != nil {
		c.ResponseErrorStream(nil, fmt.Sprintf("Failed to get store: %v", err))
		return
	}
	if store == nil {
		c.ResponseErrorStream(nil, fmt.Sprintf("Store not found: %s", storeName))
		return
	}

	// get provider
	provider, modelProviderObj, err := object.GetModelProviderFromContext("admin", store.ModelProvider)
	if err != nil {
		c.ResponseErrorStream(nil, fmt.Sprintf("Failed to get model provider: %v", err))
		return
	}

	// check type
	if req.Model != "" {
		if req.Model != provider.SubType {
			c.ResponseErrorStream(nil, fmt.Sprintf("Model mismatch: store uses %s but request specified %s", provider.SubType, req.Model))
			return
		}
	} else {
		req.Model = provider.SubType
	}

	embeddingProvider, embeddingProviderObj, err := object.GetEmbeddingProviderFromContext("admin", "")
	if err != nil {
		c.ResponseErrorStream(nil, fmt.Sprintf("Failed to get model provider: %v", err))
		return
	}

	// get question
	var question string
	if len(req.Messages) > 0 {
		question = req.Messages[len(req.Messages)-1].Content
	}

	if question == "" {
		c.ResponseErrorStream(nil, "No question provided in messages")
		return
	}

	c.Ctx.ResponseWriter.Header().Set("Content-Type", "text/event-stream")
	c.Ctx.ResponseWriter.Header().Set("Cache-Control", "no-cache")
	c.Ctx.ResponseWriter.Header().Set("Connection", "keep-alive")

	writer := &OpenAICompatibleWriter{writer: c.Ctx.ResponseWriter.ResponseWriter}

	knowledgeCount := store.KnowledgeCount
	if knowledgeCount <= 0 {
		knowledgeCount = 5
	}

	knowledge, _, _, err := object.GetNearestKnowledge(embeddingProvider, embeddingProviderObj, "admin", question, knowledgeCount)
	if err != nil && err.Error() != "no knowledge vectors found" {
		c.ResponseErrorStream(nil, err.Error())
		return
	}

	fmt.Printf("Question: [%s]\n", question)
	fmt.Printf("Knowledge: [\n")
	for i, k := range knowledge {
		fmt.Printf("Knowledge %d: [%s]\n", i, k.Text)
	}
	fmt.Printf("]\n")
	fmt.Printf("Answer: [")

	_, err = modelProviderObj.QueryText(question, writer, nil, store.Prompt, knowledge)
	if err != nil {
		if strings.Contains(err.Error(), "write tcp") {
			c.ResponseErrorStream(nil, err.Error())
			return
		}
		c.ResponseErrorStream(nil, err.Error())
		return
	}

	fmt.Printf("]\n")

	// Send end event
	_, err = c.Ctx.ResponseWriter.Write([]byte("data: [DONE]\n\n"))
	if err != nil {
		c.ResponseErrorStream(nil, err.Error())
		return
	}
	writer.Flush()
}

// writer for openai compatible
type OpenAICompatibleWriter struct {
	writer http.ResponseWriter
}

func (w *OpenAICompatibleWriter) Write(p []byte) (n int, err error) {
	prefix := []byte("event: message\ndata: ")
	suffix := []byte("\n\n")
	if bytes.HasPrefix(p, prefix) {
		data := bytes.TrimSuffix(bytes.TrimPrefix(p, prefix), suffix)
		return w.writer.Write([]byte(fmt.Sprintf("data: %s\n\n", data)))
	}
	return w.writer.Write(p)
}

func (w *OpenAICompatibleWriter) Flush() {
	if f, ok := w.writer.(http.Flusher); ok {
		f.Flush()
	}
}
