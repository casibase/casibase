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

import "io"

type ModelResult struct {
	PromptTokenCount   int
	ResponseTokenCount int
	TotalTokenCount    int
	ImageCount         int
	TotalPrice         float64
	Currency           string
}

func newModelResult(promptTokenCount int, responseTokenCount int, totalTokenCount int) *ModelResult {
	return &ModelResult{
		PromptTokenCount:   promptTokenCount,
		ResponseTokenCount: responseTokenCount,
		TotalTokenCount:    totalTokenCount,
	}
}

type ModelProvider interface {
	GetPricing() string
	QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error)
}

func GetModelProvider(typ string, subType string, clientId string, clientSecret string, temperature float32, topP float32, topK int, frequencyPenalty float32, presencePenalty float32, providerUrl string, apiVersion string, compitableProvider string) (ModelProvider, error) {
	var p ModelProvider
	var err error
	if typ == "Ollama" {
		p, err = NewLocalModelProvider("Local", "custom-model", clientSecret, temperature, topP, 0, 0, providerUrl, subType)
	} else if typ == "Local" {
		p, err = NewLocalModelProvider(typ, subType, clientSecret, temperature, topP, frequencyPenalty, presencePenalty, providerUrl, compitableProvider)
	} else if typ == "OpenAI" {
		p, err = NewOpenAiModelProvider(typ, subType, clientSecret, temperature, topP, frequencyPenalty, presencePenalty)
	} else if typ == "Gemini" {
		p, err = NewGeminiModelProvider(subType, clientSecret, temperature, topP, topK)
	} else if typ == "Azure" {
		p, err = NewAzureModelProvider(typ, subType, clientId, clientSecret, temperature, topP, frequencyPenalty, presencePenalty, providerUrl, apiVersion)
	} else if typ == "Hugging Face" {
		p, err = NewHuggingFaceModelProvider(subType, clientSecret, temperature)
	} else if typ == "Claude" {
		p, err = NewClaudeModelProvider(subType, clientSecret)
	} else if typ == "OpenRouter" {
		p, err = NewOpenRouterModelProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Baidu Cloud" {
		p, err = NewBaiduCloudModelProvider(subType, clientId, temperature, topP)
	} else if typ == "iFlytek" {
		p, err = NewiFlytekModelProvider(subType, clientSecret, temperature, topK)
	} else if typ == "ChatGLM" {
		p, err = NewChatGLMModelProvider(subType, clientSecret)
	} else if typ == "MiniMax" {
		p, err = NewMiniMaxModelProvider(subType, clientId, clientSecret, temperature)
	} else if typ == "Cohere" {
		p, err = NewCohereModelProvider(subType, clientSecret)
	} else if typ == "Moonshot" {
		p, err = NewMoonshotModelProvider(subType, clientSecret, float64(temperature))
	} else if typ == "Amazon Bedrock" {
		p, err = NewAmazonBedrockModelProvider(subType, clientSecret, float64(temperature))
	} else if typ == "Alibaba Cloud" {
		p, err = NewAlibabacloudModelProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Baichuan" {
		p, err = NewBaichuanModelProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Doubao" {
		p, err = NewDoubaoModelProvider(subType, providerUrl, clientSecret, temperature, topP)
	} else if typ == "DeepSeek" {
		p, err = NewDeepSeekProvider(subType, clientSecret, temperature, topP)
	} else if typ == "StepFun" {
		p, err = NewStepFunModelProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Tencent Cloud" {
		p, err = NewTencentCloudProvider(clientSecret, providerUrl, subType, temperature, topP)
	} else if typ == "Mistral" {
		p, err = NewMistralProvider(clientSecret, subType)
	} else if typ == "Yi" {
		p, err = NewYiProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Silicon Flow" {
		p, err = NewSiliconFlowProvider(subType, clientSecret, temperature, topP)
	} else if typ == "Dummy" {
		p, err = NewDummyModelProvider(subType)
	} else if typ == "GitHub" {
		p, err = NewGitHubModelProvider(typ, subType, clientSecret, temperature, topP, frequencyPenalty, presencePenalty)
	} else {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}
