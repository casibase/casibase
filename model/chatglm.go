// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"strings"
	"time"

	"github.com/leverly/ChatGLM/client"
)

type ChatGLMModelProvider struct {
	subType      string
	clientSecret string
}

func NewChatGLMModelProvider(subType string, clientSecret string) (*ChatGLMModelProvider, error) {
	return &ChatGLMModelProvider{subType: subType, clientSecret: clientSecret}, nil
}

func (c *ChatGLMModelProvider) GetPricing() string {
	return `URL:
https://open.bigmodel.cn/pricing

Generate Model:

| Model         | Context Length | Input Price (Per 1,000 tokens) | Output Price (Per 1,000 tokens) |
| ------------- | -------------- | ------------------------------ | ------------------------------- |
| GLM-4.5       | 32K            | 0.003 yuan                     | 0.014 yuan                      |
| GLM-4.5       | 128K           | 0.004 yuan                     | 0.016 yuan                      |
| GLM-4.5-X     | 32K            | 0.012 yuan                     | 0.032 yuan                      |
| GLM-4.5-X     | 128K           | 0.016 yuan                     | 0.064 yuan                      |
| GLM-4.5-Air   | 32K            | 0.0008 yuan                    | 0.006 yuan                      |
| GLM-4.5-Air   | 128K           | 0.0012 yuan                    | 0.008 yuan                      |
| GLM-4.5-AirX  | 32K            | 0.004 yuan                     | 0.016 yuan                      |
| GLM-4.5-AirX  | 128K           | 0.008 yuan                     | 0.032 yuan                      |
| GLM-4.5-Flash | 128K           | 0                              | 0                               |
| GLM-4.5V      | 32K            | 0.002 yuan                     | 0.006 yuan                      |
| GLM-4.5V      | 64K            | 0.004 yuan                     | 0.012 yuan                      |
`
}

func (p *ChatGLMModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	inputPrice := 0.0
	outputPrice := 0.0
	switch p.subType {
	case "glm-4.5":
		if modelResult.PromptTokenCount <= 32000 {
			inputPrice = 0.003
			outputPrice = 0.014
		} else if modelResult.PromptTokenCount <= 128000 {
			inputPrice = 0.004
			outputPrice = 0.016
		} else {
			return fmt.Errorf("calculatePrice() error: unsupported context length for model %s", p.subType)
		}
	case "glm-4.5-X":
		if modelResult.PromptTokenCount == 32000 {
			inputPrice = 0.012
			outputPrice = 0.032
		} else if modelResult.PromptTokenCount <= 128000 {
			inputPrice = 0.016
			outputPrice = 0.064
		} else {
			return fmt.Errorf("calculatePrice() error: unsupported context length for model %s", p.subType)
		}
	case "glm-4.5-Air":
		if modelResult.PromptTokenCount <= 32000 {
			inputPrice = 0.0008
			outputPrice = 0.006
		} else if modelResult.PromptTokenCount <= 128000 {
			inputPrice = 0.0012
			outputPrice = 0.008
		} else {
			return fmt.Errorf("calculatePrice() error: unsupported context length for model %s", p.subType)
		}
	case "glm-4.5-AirX":
		if modelResult.PromptTokenCount <= 32000 {
			inputPrice = 0.004
			outputPrice = 0.016
		} else if modelResult.PromptTokenCount <= 128000 {
			inputPrice = 0.008
			outputPrice = 0.032
		} else {
			return fmt.Errorf("calculatePrice() error: unsupported context length for model %s", p.subType)
		}
	case "glm-4.5-Flash":
		inputPrice = 0.0
		outputPrice = 0.0
	case "glm-4.5V":
		if modelResult.PromptTokenCount <= 32000 {
			inputPrice = 0.002
			outputPrice = 0.006
		} else if modelResult.PromptTokenCount <= 64000 {
			inputPrice = 0.004
			outputPrice = 0.012
		} else {
			return fmt.Errorf("calculatePrice() error: unsupported context length for model %s", p.subType)
		}
	default:
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	price = getPrice(modelResult.TotalTokenCount, inputPrice) + getPrice(modelResult.TotalTokenCount, outputPrice)
	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *ChatGLMModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	proxy := client.NewChatGLMClient(p.clientSecret, 30*time.Second)
	messages := []client.Message{{Role: "user", Content: question}}
	taskId, err := proxy.AsyncInvoke(p.subType, 0.2, messages)
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	flushData := func(data string) error {
		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if getContextLength(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
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

	modelResult := &ModelResult{}
	modelResult.PromptTokenCount = response.Usage.PromptTokens
	modelResult.ResponseTokenCount = response.Usage.CompletionTokens
	modelResult.TotalTokenCount = response.Usage.TotalTokens

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
