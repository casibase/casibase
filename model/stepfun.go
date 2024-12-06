// Copyright 2024 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
package model

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type StepFunModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewStepFunModelProvider(subType string, apiKey string, temperature float32, topP float32) (*StepFunModelProvider, error) {
	return &StepFunModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *StepFunModelProvider) GetPricing() string {
	return `URL:
https://platform.stepfun.com/docs/pricing/details

| Model        | Input Price per 1K characters    | Output Price per 1K characters |
|--------------|----------------------------------|--------------------------------|
| step-1-8k    | 0.005yuan/1,000 tokens           | 0.02yuan/1,000 tokens          |
| step-1-32k   | 0.015yuan/1,000 tokens           | 0.07yuan/1,000 tokens          |
| step-1-128k  | 0.04yuan/1,000 tokens            | 0.2yuan/1,000 tokens           |
| step-1-256k  | 0.095yuan/1,000 tokens           | 0.3yuan/1,000 tokens           |
| step-1-flash | 0.001yuan/1,000 tokens           | 0.004yuan/1,000 tokens         |
| step-2-16k   | 0.038yuan/1,000 tokens           | 0.12yuan/1,000 tokens          |
`
}

func (p *StepFunModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"step-1-8k":    {0.005, 0.02},
		"step-1-32k":   {0.015, 0.07},
		"step-1-128k":  {0.04, 0.2},
		"step-1-256k":  {0.095, 0.3},
		"step-1-flash": {0.001, 0.004},
		"step-2-16k":   {0.038, 0.12},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

type ChatCompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type TokenCountRequest struct {
	Model    string                  `json:"model"`
	Messages []ChatCompletionMessage `json:"messages"`
}

type TokenCountResponse struct {
	Data struct {
		TotalTokens int `json:"total_tokens"`
	} `json:"data"`
}

func StepFunNumTokensFromMessages(prompt string, response string, subType string, apiKey string) (int, error) {
	user_prompt := ChatCompletionMessage{
		Role:    "user",
		Content: prompt,
	}
	sys_response := ChatCompletionMessage{
		Role:    "system",
		Content: response,
	}
	var messages TokenCountRequest
	if response != "" {
		messages = TokenCountRequest{
			Model:    subType,
			Messages: []ChatCompletionMessage{user_prompt, sys_response},
		}
	} else {
		messages = TokenCountRequest{
			Model:    subType,
			Messages: []ChatCompletionMessage{user_prompt},
		}
	}
	// 将请求体转换为JSON格式
	requestBodyJSON, err := json.Marshal(messages)
	if err != nil {
		log.Fatalf("JSON Marshal Error: %v", err)
	}
	// 创建POST请求
	url := "https://api.stepfun.com/v1/token/count"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBodyJSON))
	if err != nil {
		log.Fatalf("Request Creation Error: %v", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey) // 用 subType 填充 API Key
	// 发送请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Request Error: %v", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Read Response Error: %v", err)
	}

	// 解析响应的 JSON
	var TokenNumResponse TokenCountResponse
	err = json.Unmarshal(body, &TokenNumResponse)
	if err != nil {
		log.Fatalf("JSON Unmarshal Error: %v", err)
	}

	// 返回token数量
	return TokenNumResponse.Data.TotalTokens, nil
}

func (p *StepFunModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	const BaseUrl = "https://api.stepfun.com/v1"
	config := openai.DefaultConfig(p.apiKey)
	config.BaseURL = BaseUrl
	client := openai.NewClientWithConfig(config)

	// set request params
	messages := []openai.ChatCompletionMessage{
		{
			Role:    "user",
			Content: question,
		},
	}

	request := openai.ChatCompletionRequest{
		Model:       p.subType,
		Messages:    messages,
		Temperature: p.temperature,
		TopP:        p.topP,
		Stream:      true,
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	modelResult := &ModelResult{}

	promptTokenCount, err := StepFunNumTokensFromMessages(question, "", p.subType, p.apiKey) // calculate token
	if err != nil {
		return nil, err
	}
	modelResult.PromptTokenCount = promptTokenCount
	modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

	StepFunMaxTokens := map[string]int{
		"step-1-8k":    8000,
		"step-1-32k":   32000,
		"step-1-128k":  128000,
		"step-1-256k":  256000,
		"step-1-flash": 8000,
		"step-2-16k":   16000,
	}
	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		if StepFunMaxTokens[p.subType] > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	stream, err := client.CreateChatCompletionStream(ctx, request)
	if err != nil {
		return nil, err
	}
	defer stream.Close()
	var receive_message string = ""
	for {
		response, err := stream.Recv()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}

		if len(response.Choices) == 0 {
			continue
		}

		data := response.Choices[0].Delta.Content
		err = flushData(data)
		if err != nil {
			return nil, err
		}

		receive_message += data
		if err != nil {
			return nil, err
		}
	}
	modelResult.TotalTokenCount, _ = StepFunNumTokensFromMessages(question, receive_message, p.subType, p.apiKey)
	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
