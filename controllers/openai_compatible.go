package controllers

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

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
	fmt.Println("0哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈")
	fmt.Println(modelProviderObj)

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

	writer := &RefinedWriter{*c.Ctx.ResponseWriter, *NewCleaner(6), []byte{}, []byte{}, []byte{}}

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

	modelResult, err := modelProviderObj.QueryText(question, writer, nil, store.Prompt, knowledge)
	if err != nil {
		if strings.Contains(err.Error(), "write tcp") {
			c.ResponseErrorStream(nil, err.Error())
			return
		}
		c.ResponseErrorStream(nil, err.Error())
		return
	}

	if writer.writerCleaner.cleaned == false {
		cleanedData := writer.writerCleaner.GetCleanedData()
		writer.buf = append(writer.buf, []byte(cleanedData)...)
		jsonData, err := ConvertMessageDataToJSON(cleanedData)
		if err != nil {
			c.ResponseErrorStream(nil, err.Error())
			return
		}

		_, err = writer.ResponseWriter.Write([]byte(fmt.Sprintf("event: message\ndata: %s\n\n", jsonData)))
		if err != nil {
			c.ResponseErrorStream(nil, err.Error())
			return
		}

		writer.Flush()
		fmt.Print(cleanedData)
	}

	fmt.Printf("]\n")

	// Send end event
	event := fmt.Sprintf("event: end\ndata: %s\n\n", "end")
	_, err = c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseErrorStream(nil, err.Error())
		return
	}

	response := openai.ChatCompletionResponse{
		ID:      util.GenerateId(),
		Object:  "chat.completion",
		Created: time.Now().Unix(),
		Model:   store.ModelProvider,
		Choices: []openai.ChatCompletionChoice{
			{
				Message: openai.ChatCompletionMessage{
					Role:    "assistant",
					Content: writer.MessageString(),
				},
				FinishReason: "stop",
			},
		},
		Usage: openai.Usage{
			PromptTokens:     modelResult.PromptTokenCount,
			CompletionTokens: modelResult.ResponseTokenCount,
			TotalTokens:      modelResult.TotalTokenCount,
		},
	}

	// Send final response
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		c.ResponseErrorStream(nil, err.Error())
		return
	}

	_, err = c.Ctx.ResponseWriter.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonResponse)))
	if err != nil {
		c.ResponseErrorStream(nil, err.Error())
		return
	}
}
