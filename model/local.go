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
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/sashabaranov/go-openai"
)

type LocalModelProvider struct {
	typ              string
	subType          string
	deploymentName   string
	secretKey        string
	temperature      float32
	topP             float32
	frequencyPenalty float32
	presencePenalty  float32
	providerUrl      string
	apiVersion       string
}

func NewLocalModelProvider(typ string, subType string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32, providerUrl string) (*LocalModelProvider, error) {
	p := &LocalModelProvider{
		typ:              typ,
		subType:          subType,
		secretKey:        secretKey,
		temperature:      temperature,
		topP:             topP,
		frequencyPenalty: frequencyPenalty,
		presencePenalty:  presencePenalty,
		providerUrl:      providerUrl,
	}
	return p, nil
}

func getLocalClientFromUrl(authToken string, url string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.BaseURL = url

	c := openai.NewClientWithConfig(config)
	return c
}

func (p *LocalModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) error {
	var client *openai.Client
	if p.typ == "Local" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
	} else if p.typ == "Azure" {
		client = getAzureClientFromToken(p.deploymentName, p.secretKey, p.providerUrl, p.apiVersion)
	} else if p.typ == "OpenAI" {
		client = getOpenAiClientFromToken(p.secretKey)
	}

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}

	model := p.subType
	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	maxTokens := getOpenAiMaxTokens(model)

	if getOpenAiModelType(p.subType) == "Chat" {
		if p.subType == "dall-e-3" {
			reqUrl := openai.ImageRequest{
				Prompt:         question,
				Model:          openai.CreateImageModelDallE3,
				Size:           openai.CreateImageSize1024x1024,
				ResponseFormat: openai.CreateImageResponseFormatURL,
				N:              1,
			}
			respUrl, err := client.CreateImage(ctx, reqUrl)
			if err != nil {
				fmt.Printf("Image creation error: %v\n", err)
				return err
			}
			fmt.Fprint(writer, respUrl.Data[0].URL)
			flusher.Flush()
			return nil
		}
		rawMessages, err := generateMessages(prompt, question, history, knowledgeMessages, model, maxTokens)
		if err != nil {
			return err
		}
		var messages []openai.ChatCompletionMessage

		if p.subType == "gpt-4-vision-preview" {
			messages, err = rawMessagesToGPT4VisionMessages(rawMessages)
			if err != nil {
				return err
			}
		} else {
			messages = rawMessagesToOpenAiMessages(rawMessages)
		}

		respStream, err := client.CreateChatCompletionStream(
			ctx,
			ChatCompletionRequest(model, messages, temperature, topP, frequencyPenalty, presencePenalty),
		)
		if err != nil {
			return err
		}
		defer respStream.Close()

		isLeadingReturn := true
		for {
			completion, streamErr := respStream.Recv()
			if streamErr != nil {
				if streamErr == io.EOF {
					break
				}
				return streamErr
			}

			if len(completion.Choices) == 0 {
				continue
			}

			data := completion.Choices[0].Delta.Content
			if isLeadingReturn && len(data) != 0 {
				if strings.Count(data, "\n") == len(data) {
					continue
				} else {
					isLeadingReturn = false
				}
			}

			err = flushData(data)
			if err != nil {
				return err
			}
		}
	} else if getOpenAiModelType(p.subType) == "Completion" {
		respStream, err := client.CreateCompletionStream(
			ctx,
			openai.CompletionRequest{
				Model:            model,
				Prompt:           question,
				Stream:           true,
				Temperature:      temperature,
				TopP:             topP,
				FrequencyPenalty: frequencyPenalty,
				PresencePenalty:  presencePenalty,
			},
		)
		if err != nil {
			return err
		}
		defer respStream.Close()

		isLeadingReturn := true
		for {
			completion, streamErr := respStream.Recv()
			if streamErr != nil {
				if streamErr == io.EOF {
					break
				}
				return streamErr
			}

			data := completion.Choices[0].Text
			if isLeadingReturn && len(data) != 0 {
				if strings.Count(data, "\n") == len(data) {
					continue
				} else {
					isLeadingReturn = false
				}
			}

			err = flushData(data)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
