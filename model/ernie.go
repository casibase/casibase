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

func (p *ErnieModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := ernie.NewDefaultClient(p.apiKey, p.secretKey)
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
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
		builder.WriteString(data)
		return nil
	}

	temperature := p.temperature
	topP := p.topP
	presencePenalty := p.presencePenalty

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
			return err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				return nil
			}

			if err != nil {
				return err
			}

			err = flushData(response.Result)
			if err != nil {
				return err
			}
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
			return err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				return nil
			}

			if err != nil {
				return err
			}

			err = flushData(response.Result)
			if err != nil {
				return err
			}
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
			return err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				return nil
			}

			if err != nil {
				return err
			}

			err = flushData(response.Result)
			if err != nil {
				return err
			}
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
			return err
		}

		defer stream.Close()
		for {
			response, err := stream.Recv()
			if errors.Is(err, io.EOF) {
				return nil
			}

			if err != nil {
				return err
			}

			err = flushData(response.Result)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
