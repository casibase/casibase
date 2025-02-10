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
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	ernie "github.com/anhao/go-ernie"
)

type ErnieModelProvider struct {
	subType         string
	apiKey          string
	secretKey       string
	temperature     float32
	topP            float32
	presencePenalty float32
}

func NewErnieModelProvider(subType string, apiKey string, secretKey string, temperature float32, topP float32, presencePenalty float32) (*ErnieModelProvider, error) {
	return &ErnieModelProvider{
		subType:         subType,
		apiKey:          apiKey,
		secretKey:       secretKey,
		temperature:     temperature,
		topP:            topP,
		presencePenalty: presencePenalty,
	}, nil
}

func (p *ErnieModelProvider) GetPricing() string {
	return `URL:
https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Blfmc9dlf

| Model                               | Input Price per 1K characters | Output Price per 1K characters |
|-------------------------------------|-------------------------------|--------------------------------|
| ERNIE-Bot 4.0                       | 0.120 (originally 0.15 CNY)   | 0.120 (originally 0.3 CNY)     |
| ERNIE-Bot-8k                        | 0.024                         | 0.048                          |
| ERNIE-Bot                           | 0.012                         | 0.012                          |
| ERNIE-Bot-turbo-0922                | 0.008                         | 0.008                          |
| EB-turbo-AppBuilder                 | 0.008                         | 0.008                          |
| Tokenizer Public Cloud API          | 0.0006                        | 0.0006                         |
| ERNIE-Speed                         | 0.004                         | 0.008                          |
| ERNIE-3.5-4K-0205                   | 0.012                         | 0.012                          |
| ERNIE-3.5-8K-0205                   | 0.024                         | 0.048                          |
| ERNIE-3.5-8K-1222                   | 0.012                         | 0.012                          |
| BLOOMZ-7B                           | 0.004                         | 0.004                          |
| Llama-2-7B-Chat                     | 0.004                         | 0.004                          |
| Llama-2-13B-Chat                    | 0.004                         | 0.004                          |
| Llama-2-70B-Chat                    | 0.006                         | 0.006                          |
| ChatGLM2-6B-32K                     | 0.004                         | 0.004                          |
| AquilaChat-7B                       | 0.004                         | 0.004                          |
| Mixtral-8x7B-Instruct               | 0.035                         | 0.035                          |
| SQLCoder-7B                         | 0.004                         | 0.004                          |
| CodeLlama-7B-Instruct               | 0.004                         | 0.004                          |
| XuanYuan-70B-Chat-4bit              | 0.035                         | 0.035                          |
| Qianfan-BLOOMZ-7B-compressed        | 0.004                         | 0.004                          |
| Qianfan-Chinese-Llama-2-7B          | 0.004                         | 0.004                          |
| Qianfan-Chinese-Llama-2-13B         | 0.006                         | 0.006                          |
| ChatLaw                             | 0.008                         | 0.008                          |
`
}

func (p *ErnieModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"ERNIE-Bot 4.0":                {0.120, 0.120},
		"ERNIE-Bot-8k":                 {0.024, 0.048},
		"ERNIE-Bot":                    {0.012, 0.012},
		"ERNIE-Bot-turbo-0922":         {0.008, 0.008},
		"ERNIE-Speed":                  {0.004, 0.008},
		"EB-turbo-AppBuilder":          {0.008, 0.008},
		"ERNIE-3.5-4K-0205":            {0.012, 0.012},
		"ERNIE-3.5-8K-0205":            {0.024, 0.048},
		"ERNIE-3.5-8K-1222":            {0.012, 0.012},
		"BLOOMZ-7B":                    {0.004, 0.004},
		"Llama-2":                      {0.004, 0.004}, // Equal to Llama-2-7B-Chat
		"Llama-2-7B-Chat":              {0.004, 0.004},
		"Llama-2-13B-Chat":             {0.004, 0.004},
		"Llama-2-70B-Chat":             {0.006, 0.006},
		"ChatGLM2-6B-32K":              {0.004, 0.004},
		"AquilaChat-7B":                {0.004, 0.004},
		"Mixtral-8x7B-Instruct":        {0.035, 0.035},
		"SQLCoder-7B":                  {0.004, 0.004},
		"CodeLlama-7B-Instruct":        {0.004, 0.004},
		"XuanYuan-70B-Chat-4bit":       {0.035, 0.035},
		"Qianfan-BLOOMZ-7B-compressed": {0.004, 0.004},
		"Qianfan-Chinese-Llama-2-7B":   {0.004, 0.004},
		"Qianfan-Chinese-Llama-2-13B":  {0.006, 0.006},
		"ChatLaw":                      {0.008, 0.008},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.TotalTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.TotalTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *ErnieModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client := ernie.NewDefaultClient(p.apiKey, p.secretKey)
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	messages := []ernie.ChatCompletionMessage{}

	for i := len(history) - 1; i >= 0; i-- {
		rawMessage := history[i]
		role := "user"
		if rawMessage.Author == "AI" {
			role = "assistant"
		}
		messages = append(messages, ernie.ChatCompletionMessage{
			Role:    role,
			Content: rawMessage.Text,
		})
	}
	messages = append(messages, ernie.ChatCompletionMessage{
		Role:    "user",
		Content: question,
	})

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if 4096 > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	temperature := p.temperature
	topP := p.topP
	presencePenalty := p.presencePenalty

	modelResult := &ModelResult{}

	if p.subType == "ERNIE-Bot" {
		stream, err := client.CreateErnieBotChatCompletionStream(ctx,
			ernie.ErnieBotRequest{
				Messages:        messages,
				Temperature:     temperature,
				TopP:            topP,
				PresencePenalty: presencePenalty,
				Stream:          true,
			},
		)
		if err != nil {
			return nil, err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				err = p.calculatePrice(modelResult)
				if err != nil {
					return nil, err
				}

				return modelResult, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount += response.Usage.PromptTokens
			modelResult.ResponseTokenCount += response.Usage.CompletionTokens
			modelResult.TotalTokenCount += response.Usage.TotalTokens
		}
	} else if p.subType == "ERNIE-Bot-turbo" {
		stream, err := client.CreateErnieBotTurboChatCompletionStream(ctx,
			ernie.ErnieBotTurboRequest{
				Messages:        messages,
				Temperature:     temperature,
				TopP:            topP,
				PresencePenalty: presencePenalty,
				Stream:          true,
			},
		)
		if err != nil {
			return nil, err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				err = p.calculatePrice(modelResult)
				if err != nil {
					return nil, err
				}

				return modelResult, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount += response.Usage.PromptTokens
			modelResult.ResponseTokenCount += response.Usage.CompletionTokens
			modelResult.TotalTokenCount += response.Usage.TotalTokens
		}
	} else if p.subType == "BLOOMZ-7B" {
		stream, err := client.CreateBloomz7b1ChatCompletionStream(
			ctx,
			ernie.Bloomz7b1Request{
				Messages: messages,
				Stream:   true,
			},
		)
		if err != nil {
			return nil, err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				err = p.calculatePrice(modelResult)
				if err != nil {
					return nil, err
				}

				return modelResult, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount += response.Usage.PromptTokens
			modelResult.ResponseTokenCount += response.Usage.CompletionTokens
			modelResult.TotalTokenCount += response.Usage.TotalTokens
		}
	} else if p.subType == "Llama-2" {
		stream, err := client.CreateLlamaChatCompletionStream(
			ctx,
			ernie.LlamaChatRequest{
				Messages: messages,
				Stream:   true,
				Model:    "llama_2_7b",
			},
		)
		if err != nil {
			return nil, err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				err = p.calculatePrice(modelResult)
				if err != nil {
					return nil, err
				}

				return modelResult, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount += response.Usage.PromptTokens
			modelResult.ResponseTokenCount += response.Usage.CompletionTokens
			modelResult.TotalTokenCount += response.Usage.TotalTokens
		}
	}

	return modelResult, nil
}
