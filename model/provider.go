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
	"io"
	"strings"
)

type ModelProvider interface {
	QueryText(question string, writer io.Writer, builder *strings.Builder) error
}

func GetModelProvider(typ string, subType string, clientId string, clientSecret string, temperature float32, topP float32, topK int, frequencyPenalty float32, presencePenalty float32, providerUrl string, apiVersion string) (ModelProvider, error) {
	var p ModelProvider
	var err error
	if typ == "OpenAI" {
		p, err = NewOpenAiModelProvider(subType, clientSecret, temperature, topP, frequencyPenalty, presencePenalty)
	} else if typ == "Hugging Face" {
		p, err = NewHuggingFaceModelProvider(subType, clientSecret)
	} else if typ == "Claude" {
		p, err = NewClaudeModelProvider(subType, clientSecret)
	} else if typ == "OpenRouter" {
		p, err = NewOpenRouterModelProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Ernie" {
		p, err = NewErnieModelProvider(subType, clientId, clientSecret, temperature, topP, presencePenalty)
	} else if typ == "iFlytek" {
		p, err = NewiFlytekModelProvider(subType, clientSecret, temperature, topK)
	} else if typ == "ChatGLM" {
		p, err = NewChatGLMModelProvider(subType, clientSecret)
	} else if typ == "MiniMax" {
		p, err = NewMiniMaxModelProvider(subType, clientId, clientSecret, temperature)
	} else if typ == "Local" {
		p, err = NewLocalModelProvider(typ, subType, clientSecret, temperature, topP, frequencyPenalty, presencePenalty, providerUrl)
	} else if typ == "Azure" {
		p, err = NewAzureModelProvider(typ, subType, clientId, clientSecret, temperature, topP, frequencyPenalty, presencePenalty, providerUrl, apiVersion)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}
