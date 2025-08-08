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
	"crypto/tls"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/sashabaranov/go-openai"
)

type LocalModelProvider struct {
	typ                          string
	subType                      string
	deploymentName               string
	secretKey                    string
	temperature                  float32
	topP                         float32
	frequencyPenalty             float32
	presencePenalty              float32
	providerUrl                  string
	apiVersion                   string
	compatibleProvider           string
	inputPricePerThousandTokens  float64
	outputPricePerThousandTokens float64
	currency                     string
}

func NewLocalModelProvider(typ string, subType string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32, providerUrl string, compatibleProvider string, inputPricePerThousandTokens float64, outputPricePerThousandTokens float64, Currency string) (*LocalModelProvider, error) {
	p := &LocalModelProvider{
		typ:                          typ,
		subType:                      subType,
		secretKey:                    secretKey,
		temperature:                  temperature,
		topP:                         topP,
		frequencyPenalty:             frequencyPenalty,
		presencePenalty:              presencePenalty,
		providerUrl:                  providerUrl,
		compatibleProvider:           compatibleProvider,
		inputPricePerThousandTokens:  inputPricePerThousandTokens,
		outputPricePerThousandTokens: outputPricePerThousandTokens,
		currency:                     Currency,
	}
	return p, nil
}

func getLocalClientFromUrl(authToken string, url string) *openai.Client {
	config := openai.DefaultConfig(authToken)
	config.BaseURL = url

	transport := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	httpClient := http.Client{Transport: transport}
	config.HTTPClient = &httpClient

	c := openai.NewClientWithConfig(config)
	return c
}

func (p *LocalModelProvider) GetPricing() string {
	return `URL:
https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/

Language models:

| Models                | Context | Input (Per 1,000 tokens) | Output (Per 1,000 tokens) |
|-----------------------|---------|--------------------------|--------------------------|
| GPT-3.5-Turbo         | 16K     | $0.0005                  | $0.0015                  |
| GPT-4                 | 8K      | $0.03                    | $0.06                    |
| GPT-4                 | 32K     | $0.06                    | $0.12                    |
| GPT-4-Turbo           | 128K    | $0.01                    | $0.03                    |
| GPT-4o                | 128K    | $0.0025                  | $0.0075                  |
| GPT-4o-mini           | 128K    | $0.000075                | $0.0003                  |
| GPT-4.1               | 100K    | $0.002                   | $0.008                   |
| GPT-4.1-mini          | 100K    | $0.0004	                 | $0.0016                  |
| GPT-4.1-nano          | 100K    | $0.0001                  | $0.0004                  |
| o1                    | 200K    | $0.015                   | $0.060                   |
| o1-pro                | 200K    | $0.15                    | $0.6                     |
| o3                    | 200K    | $0.002                   | $0.008                   |
| o3-mini               | 200K    | $0.0011                  | $0.0044                   |
| o4-mini               | 200K    | $0.0011                  | $0.0044                  |

Image models:

| Models   | Quality | Resolution               | Price (per image) |
|----------|---------|--------------------------|------------------|
| Dall-E-3 | Standard| 1024 * 1024              | N/A              |
|          | Standard| 1024 * 1792, 1792 * 1024 | $0.08            |
| Dall-E-3 | HD      | 1024 * 1024              | N/A              |
|          | HD      | 1024 * 1792, 1792 * 1024 | N/A              |
| Dall-E-2 | Standard| 1024 * 1024              | N/A              |
`
}

func (p *LocalModelProvider) calculatePrice(modelResult *ModelResult) error {
	model := p.subType
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64
	switch {
	// gpt 3.5 turbo model Support:
	case strings.Contains(model, "gpt-3.5"):
		inputPricePerThousandTokens = 0.0005
		outputPricePerThousandTokens = 0.0015
		modelResult.Currency = "USD"

	// gpt 4.5 model
	case strings.Contains(model, "gpt-4.5"):
		if strings.Contains(model, "preview") {
			inputPricePerThousandTokens = 0.0375
			outputPricePerThousandTokens = 0.075
		} else {
			inputPricePerThousandTokens = 0.03
			outputPricePerThousandTokens = 0.06
		}
		modelResult.Currency = "USD"

	// gpt 4.1 model
	case strings.Contains(model, "gpt-4.1"):
		if strings.Contains(model, "4.1-mini") {
			inputPricePerThousandTokens = 0.0004
			outputPricePerThousandTokens = 0.0016
		} else if strings.Contains(model, "4.1-nano") {
			inputPricePerThousandTokens = 0.0001
			outputPricePerThousandTokens = 0.0004
		} else {
			inputPricePerThousandTokens = 0.002
			outputPricePerThousandTokens = 0.008
		}
		modelResult.Currency = "USD"

	// gpt 4.0 model
	case strings.Contains(model, "gpt-4"):
		if strings.Contains(model, "turbo") {
			inputPricePerThousandTokens = 0.01
			outputPricePerThousandTokens = 0.03
		} else if strings.Contains(model, "4o-mini") {
			inputPricePerThousandTokens = 0.000075
			outputPricePerThousandTokens = 0.0003
		} else if strings.Contains(model, "4o") {
			inputPricePerThousandTokens = 0.0025
			outputPricePerThousandTokens = 0.0075
		} else {
			inputPricePerThousandTokens = 0.03
			outputPricePerThousandTokens = 0.06
		}
		modelResult.Currency = "USD"

	// o1 model
	case strings.Contains(model, "o1"):
		if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.15
			outputPricePerThousandTokens = 0.6
		} else {
			inputPricePerThousandTokens = 0.015
			outputPricePerThousandTokens = 0.060
		}
		modelResult.Currency = "USD"

	// o3 model
	case strings.Contains(model, "o3"):
		if strings.Contains(model, "mini") {
			inputPricePerThousandTokens = 0.0011
			outputPricePerThousandTokens = 0.0044
		} else {
			inputPricePerThousandTokens = 0.002
			outputPricePerThousandTokens = 0.008
		}
		modelResult.Currency = "USD"

	// o4 model
	case strings.Contains(model, "o4"):
		if strings.Contains(model, "o4-mini") {
			inputPricePerThousandTokens = 0.0011
			outputPricePerThousandTokens = 0.0044
		} else {
			inputPricePerThousandTokens = 0.0011
			outputPricePerThousandTokens = 0.0044
		}
		modelResult.Currency = "USD"

	// local custom model:
	case model == "custom-model":
		inputPricePerThousandTokens = p.inputPricePerThousandTokens
		outputPricePerThousandTokens = p.outputPricePerThousandTokens
		modelResult.Currency = p.currency

	// dall-e model
	case strings.Contains(model, "dall-e-3"):
		modelResult.TotalPrice = float64(modelResult.ImageCount) * 0.08
		modelResult.Currency = "USD"
		return nil
	default:
		// inputPricePerThousandTokens = 0
		// outputPricePerThousandTokens = 0
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", model)
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	return nil
}

func (p *LocalModelProvider) CalculatePrice(modelResult *ModelResult) error {
	return p.calculatePrice(modelResult)
}

func flushDataAzure(data string, writer io.Writer) error {
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	for _, runeValue := range data {
		char := string(runeValue)
		_, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", char)
		if err != nil {
			return err
		}

		flusher.Flush()

		delta := 0
		if !unicode.In(runeValue, unicode.Latin) {
			delta = 50
		}

		var delay int
		if char == "," || char == "，" {
			delay = 20 + rand.Intn(50) + delta
		} else if char == "." || char == "。" || char == "!" || char == "！" || char == "?" || char == "？" {
			delay = 50 + rand.Intn(50) + delta
		} else if char == " " || char == "　" || char == "(" || char == "（" || char == ")" || char == "）" {
			delay = 10 + rand.Intn(50) + delta
		} else {
			delay = rand.Intn(1 + delta*2/5)
		}

		if unicode.In(runeValue, unicode.Latin) {
			delay -= 20
		}

		if delay > 0 {
			time.Sleep(time.Duration(delay) * time.Millisecond)
		}
	}
	return nil
}

func flushDataOpenai(data string, writer io.Writer) error {
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
		return err
	}
	flusher.Flush()
	return nil
}

func flushDataThink(data string, eventType string, writer io.Writer) error {
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	if _, err := fmt.Fprintf(writer, "event: %s\ndata: %s\n\n", eventType, data); err != nil {
		return err
	}
	flusher.Flush()
	return nil
}

func (p *LocalModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	var client *openai.Client
	var flushData interface{} // Can be either flushData or flushDataThink

	if p.typ == "Local" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
		flushData = flushDataOpenai
	} else if p.typ == "Azure" {
		client = getAzureClientFromToken(p.deploymentName, p.secretKey, p.providerUrl, p.apiVersion)
		flushData = flushDataAzure
	} else if p.typ == "OpenAI" {
		client = GetOpenAiClientFromToken(p.secretKey)
		flushData = flushDataOpenai
	} else if p.typ == "GitHub" {
		client = getGitHubClientFromToken(p.secretKey, p.providerUrl)
		flushData = flushDataOpenai
	} else if p.typ == "Custom" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
		flushData = flushDataOpenai
	} else if p.typ == "Custom-think" {
		client = getLocalClientFromUrl(p.secretKey, p.providerUrl)
		flushData = flushDataThink
	}

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	model := p.subType
	if model == "custom-model" && p.compatibleProvider != "" {
		model = p.compatibleProvider
	} else if model == "custom-model" && p.compatibleProvider == "" {
		model = "gpt-3.5-turbo"
	}

	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty

	maxTokens := getContextLength(model)

	modelResult := &ModelResult{}
	if getOpenAiModelType(p.subType) == "Chat" {
		if p.subType == "dall-e-3" {
			if strings.HasPrefix(question, "$CasibaseDryRun$") {
				return modelResult, nil
			}
			reqUrl := openai.ImageRequest{
				Prompt:         question,
				Model:          openai.CreateImageModelDallE3,
				Size:           openai.CreateImageSize1024x1024,
				ResponseFormat: openai.CreateImageResponseFormatURL,
				N:              1,
			}

			respUrl, err := client.CreateImage(ctx, reqUrl)
			if err != nil {
				return nil, err
			}

			url := fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", respUrl.Data[0].URL)
			fmt.Fprint(writer, url)
			flusher.Flush()

			modelResult.ImageCount = 1
			modelResult.TotalTokenCount = modelResult.ImageCount
			err = p.calculatePrice(modelResult)
			if err != nil {
				return nil, err
			}

			return modelResult, nil
		}

		rawMessages, err := OpenaiGenerateMessages(prompt, question, history, knowledgeMessages, model, maxTokens)
		if err != nil {
			return nil, err
		}
		if agentInfo != nil && agentInfo.AgentMessages != nil && agentInfo.AgentMessages.Messages != nil {
			rawMessages = append(rawMessages, agentInfo.AgentMessages.Messages...)
		}

		var messages []openai.ChatCompletionMessage
		if IsVisionModel(p.subType) {
			messages, err = OpenaiRawMessagesToGptVisionMessages(rawMessages)
			if err != nil {
				return nil, err
			}
		} else {
			messages = OpenaiRawMessagesToMessages(rawMessages)
		}

		// https://github.com/sashabaranov/go-openai/pull/223#issuecomment-1494372875
		promptTokenCount, err := OpenaiNumTokensFromMessages(messages, model)
		if err != nil {
			return nil, err
		}

		modelResult.PromptTokenCount = promptTokenCount
		modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount
		err = p.calculatePrice(modelResult)
		if err != nil {
			return nil, err
		}

		if strings.HasPrefix(question, "$CasibaseDryRun$") {
			if GetOpenAiMaxTokens(p.subType) > modelResult.TotalTokenCount {
				return modelResult, nil
			} else {
				return nil, fmt.Errorf("exceed max tokens")
			}
		}

		req := ChatCompletionRequest(model, messages, temperature, topP, frequencyPenalty, presencePenalty)
		if agentInfo != nil && agentInfo.AgentClients != nil {
			tools, err := reverseToolsToOpenAi(agentInfo.AgentClients.Tools)
			if err != nil {
				return nil, err
			}
			req.Tools = tools
			req.ToolChoice = "auto"
		}

		respStream, err := client.CreateChatCompletionStream(
			ctx,
			req,
		)
		if err != nil {
			return nil, err
		}
		defer respStream.Close()

		isLeadingReturn := true
		var (
			answerData   strings.Builder
			toolCalls    []openai.ToolCall
			toolCallsMap map[int]int
		)

		for {
			completion, streamErr := respStream.Recv()
			if streamErr != nil {
				if streamErr == io.EOF {
					break
				}
				return nil, streamErr
			}

			if len(completion.Choices) == 0 {
				continue
			}
			if completion.Choices[0].Delta.ToolCalls != nil {
				for _, toolCall := range completion.Choices[0].Delta.ToolCalls {
					toolCalls, toolCallsMap = handleToolCallsParameters(toolCall, toolCalls, toolCallsMap)
				}
			}

			// Handle both regular content and reasoning content
			if p.typ == "Custom-think" {
				// For Custom-think type, we'll handle both reasoning and regular content
				flushThink := flushData.(func(string, string, io.Writer) error)

				// Check if we have reasoning content (think_content)
				if completion.Choices[0].Delta.ReasoningContent != "" {
					reasoningData := completion.Choices[0].Delta.ReasoningContent
					err = flushThink(reasoningData, "reason", writer)
					if err != nil {
						return nil, err
					}
				}

				// Handle regular content
				if completion.Choices[0].Delta.Content != "" {
					data := completion.Choices[0].Delta.Content
					if isLeadingReturn && len(data) != 0 {
						if strings.Count(data, "\n") == len(data) {
							continue
						} else {
							isLeadingReturn = false
						}
					}

					err = flushThink(data, "message", writer)
					if err != nil {
						return nil, err
					}

					answerData.WriteString(data)
				}
			} else {
				// For all other provider types, use the standard flush function
				flushStandard := flushData.(func(string, io.Writer) error)

				data := completion.Choices[0].Delta.Content
				if isLeadingReturn && len(data) != 0 {
					if strings.Count(data, "\n") == len(data) {
						continue
					} else {
						isLeadingReturn = false
					}
				}

				err = flushStandard(data, writer)
				if err != nil {
					return nil, err
				}

				answerData.WriteString(data)
			}
		}

		err = handleToolCalls(toolCalls, flushData, writer)
		if err != nil {
			return nil, err
		}

		if agentInfo != nil && agentInfo.AgentMessages != nil {
			agentInfo.AgentMessages.ToolCalls = toolCalls
		}

		// https://github.com/sashabaranov/go-openai/pull/223#issuecomment-1494372875
		responseTokenCount, err := GetTokenSize(model, answerData.String())
		if err != nil {
			return nil, err
		}

		modelResult.ResponseTokenCount += responseTokenCount
		modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount
		err = p.calculatePrice(modelResult)
		if err != nil {
			return nil, err
		}
		return modelResult, nil
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
			return nil, err
		}
		defer respStream.Close()

		isLeadingReturn := true
		var response strings.Builder
		for {
			completion, streamErr := respStream.Recv()
			if streamErr != nil {
				if streamErr == io.EOF {
					break
				}
				return nil, streamErr
			}

			data := completion.Choices[0].Text
			if isLeadingReturn && len(data) != 0 {
				if strings.Count(data, "\n") == len(data) {
					continue
				} else {
					isLeadingReturn = false
				}
			}

			// Here we also need to handle the different flush functions
			if p.typ == "Custom-think" {
				flushThink := flushData.(func(string, string, io.Writer) error)
				err = flushThink(data, "message", writer)
			} else {
				flushStandard := flushData.(func(string, io.Writer) error)
				err = flushStandard(data, writer)
			}

			if err != nil {
				return nil, err
			}

			_, err = response.WriteString(data)
			if err != nil {
				return nil, err
			}
		}

		modelResult, err = getDefaultModelResult(model, question, response.String())
		return modelResult, nil
	} else {
		return nil, fmt.Errorf("QueryText() error: unknown model type: %s", p.subType)
	}
}
