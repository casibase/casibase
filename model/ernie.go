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
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

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

func (p *ErnieModelProvider) GetPricing() (string, string) {
	return "CNY", `URL:
https://cloud.baidu.com/article/517050

| Module     | Service Type                                                                | Price                   |
|------------|-----------------------------------------------------------------------------|-------------------------|
| Prediction | ERNIE-Bot Large Model Public Cloud Online Invocation Service                | ¥0.012/thousand tokens  |
| Prediction | ERNIE-Bot-turbo Large Model Public Cloud Online Invocation Service (Input)  | ¥0.008/thousand tokens  |
| Prediction | ERNIE-Bot-turbo Large Model Public Cloud Online Invocation Service (Output) | ¥0.008/thousand tokens  |
| Prediction | BLOOMZ-7B Large Model Public Cloud Online Invocation Service                | ¥0.006/thousand tokens  |
| Prediction | Embedding-V1 Public Cloud Online Invocation Service                         | ¥0.002/thousand tokens  |
| Prediction | Llama-2-7B-Chat Public Cloud Online Invocation Service                      | ¥0.006/thousand tokens  |
| Prediction | Llama-2-13B-Chat Public Cloud Online Invocation Service                     | ¥0.008/thousand tokens  |
| Prediction | Llama-2-70B-Chat Public Cloud Online Invocation Service                     | ¥0.044/thousand tokens  |
| Prediction | Pre-built Model Public Cloud Online Invocation Service                      | Free for a limited time |
`
}

func (p *ErnieModelProvider) calculatePrice(mr *ModelResult) {
	priceTable := map[string][]float64{
		"ERNIE-Bot":       {0.012, 0.012},
		"ERNIE-Bot-turbo": {0.008, 0.008},
		"BLOOMZ-7B":       {0.006, 0.006},
		"Llama-2":         {0.006, 0.006}, // Llama-2-7B-Chat
	}
	if price, ok := priceTable[p.subType]; ok {
		mr.TotalPrice = (price[0]*float64(mr.PromptTokenCount) + price[1]*float64(mr.ResponseTokenCount)) / 1_000.0
	} else {
		// model not found
		mr.TotalPrice = 0.0
	}
}

func (p *ErnieModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client := ernie.NewDefaultClient(p.apiKey, p.secretKey)
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	messages := []ernie.ChatCompletionMessage{
		{
			Role:    "user",
			Content: question,
		},
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

	mr := new(ModelResult)

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
				p.calculatePrice(mr)
				return mr, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			mr.PromptTokenCount += response.Usage.PromptTokens
			mr.ResponseTokenCount += response.Usage.CompletionTokens
			mr.TotalTokenCount += response.Usage.TotalTokens
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
				p.calculatePrice(mr)
				return mr, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			mr.PromptTokenCount += response.Usage.PromptTokens
			mr.ResponseTokenCount += response.Usage.CompletionTokens
			mr.TotalTokenCount += response.Usage.TotalTokens
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
				p.calculatePrice(mr)
				return mr, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			mr.PromptTokenCount += response.Usage.PromptTokens
			mr.ResponseTokenCount += response.Usage.CompletionTokens
			mr.TotalTokenCount += response.Usage.TotalTokens
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
				p.calculatePrice(mr)
				return mr, nil
			}

			if err != nil {
				return nil, err
			}

			err = flushData(response.Result)
			if err != nil {
				return nil, err
			}

			mr.PromptTokenCount += response.Usage.PromptTokens
			mr.ResponseTokenCount += response.Usage.CompletionTokens
			mr.TotalTokenCount += response.Usage.TotalTokens
		}
	}

	return mr, nil
}
