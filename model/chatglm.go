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

package model

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/leverly/ChatGLM/client"
)

const (
	ChatglmModelGLM4      = "GLM-4"
	ChatglmModelGLM4V     = "GLM-4V"
	ChatglmModelGLM3TURBO = "GLM-3-Turbo"
)

type ChatGLMModelProvider struct {
	subType      string
	clientSecret string
}

func NewChatGLMModelProvider(subType string, clientSecret string) (*ChatGLMModelProvider, error) {
	return &ChatGLMModelProvider{subType: subType, clientSecret: clientSecret}, nil
}

func (c *ChatGLMModelProvider) GetPricing() (string, string) {
	return "CNY", `URL:
https://open.bigmodel.cn/pricing

Generate Model:

| Model        | Context Length | Unit Price (Per 1,000 tokens) |
|--------------|----------------|-------------------------------|
| GLM-4        | 128K           | 0.1 yuan / K tokens          |
| GLM-4V       | 2K             | 0.1 yuan / K tokens          |
| GLM-3-Turbo  | 128K           | 0.005 yuan / K tokens        |
`
}

func (c *ChatGLMModelProvider) calculate(mr *ModelResult) {
	switch c.subType {
	case ChatglmModelGLM3TURBO:
		mr.TotalPrice = float64(mr.PromptTokenCount) * 0.005 / 1_000
	case ChatglmModelGLM4:
		mr.TotalPrice = float64(mr.PromptTokenCount) * 0.1 / 1_000
	case ChatglmModelGLM4V:
		mr.TotalPrice = float64(mr.PromptTokenCount) * 0.1 / 1_000
	}
}

func (p *ChatGLMModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	proxy := client.NewChatGLMClient(p.clientSecret, 30*time.Second)
	text := []client.Message{{Role: "user", Content: question}}
	taskId, err := proxy.AsyncInvoke(p.subType, 0.2, text)
	if err != nil {
		return nil, err
	}
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	response, err := proxy.AsyncInvokeTask(p.subType, taskId)
	if err != nil {
		return nil, err
	}
	content := (*response.Choices)[0].Content
	err = flushData(content)
	if err != nil {
		return nil, err
	}

	// get token count and price
	mr := new(ModelResult)
	mr.PromptTokenCount = response.Usage.PromptTokens
	mr.ResponseTokenCount = response.Usage.CompletionTokens
	mr.TotalTokenCount = response.Usage.TotalTokens
	p.calculate(mr)

	return mr, nil
}
