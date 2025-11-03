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
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/proxy"
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/azure"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/packages/param"
	"github.com/openai/openai-go/v2/responses"
)

type AzureModelProvider struct {
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

func NewAzureModelProvider(typ string, subType string, deploymentName string, secretKey string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32, providerUrl string, apiVersion string) (*AzureModelProvider, error) {
	p := &AzureModelProvider{
		subType:          subType,
		deploymentName:   deploymentName,
		secretKey:        secretKey,
		temperature:      temperature,
		topP:             topP,
		frequencyPenalty: frequencyPenalty,
		presencePenalty:  presencePenalty,
		providerUrl:      providerUrl,
		apiVersion:       apiVersion,
	}
	return p, nil
}

func (p *AzureModelProvider) GetPricing() string {
	return getOpenAIModelPrice()
}

func getAzureClientFromToken(authToken string, url string, apiVersion string) openai.Client {
	httpClient := proxy.ProxyHttpClient
	c := openai.NewClient(
		azure.WithEndpoint(url, apiVersion),
		azure.WithAPIKey(authToken),
		option.WithHTTPClient(httpClient),
	)
	return c
}

func (p *AzureModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	var client openai.Client
	var flushData interface{}

	client = getAzureClientFromToken(p.secretKey, p.providerUrl, p.apiVersion)
	flushData = flushDataThink

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	model := p.subType
	// Use deployment name if specified, otherwise use subType as model name
	if p.deploymentName != "" {
		model = p.deploymentName
	}

	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty

	maxTokens := getContextLength(model)

	modelResult := &ModelResult{}
	if getOpenAiModelType(p.subType) == "Chat" {
		rawMessages, err := OpenaiGenerateMessages(prompt, question, history, knowledgeMessages, p.subType, maxTokens, lang)
		if err != nil {
			return nil, err
		}
		if agentInfo != nil && agentInfo.AgentMessages != nil && agentInfo.AgentMessages.Messages != nil {
			rawMessages = append(rawMessages, agentInfo.AgentMessages.Messages...)
		}

		var messages responses.ResponseInputParam
		var toolCalls []responses.ResponseFunctionToolCall

		if IsVisionModel(p.subType) {
			messages, err = openaiRawMessagesToGptVisionMessages(rawMessages)
			if err != nil {
				return nil, err
			}
		} else {
			messages = openaiRawMessagesToMessages(rawMessages)
		}

		if strings.HasPrefix(question, "$CasibaseDryRun$") {
			promptTokenCount, err := openaiNumTokensFromMessages(messages, p.subType)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount = promptTokenCount
			modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount
			err = CalculateOpenAIModelPrice(p.subType, modelResult, lang)
			if err != nil {
				return nil, err
			}

			if GetOpenAiMaxTokens(p.subType) > modelResult.TotalTokenCount {
				return modelResult, nil
			} else {
				return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
			}
		}

		req := responses.ResponseNewParams{
			Instructions: param.NewOpt[string](prompt),
			Input:        responses.ResponseNewParamsInputUnion{OfInputItemList: messages},
			Model:        model,
			Temperature:  param.NewOpt[float64](float64(temperature)),
			TopP:         param.NewOpt[float64](float64(topP)),
		}
		if agentInfo != nil && agentInfo.AgentClients != nil {
			agentTools, err := reverseMcpToolsToOpenAi(agentInfo.AgentClients.Tools)
			if err != nil {
				return nil, err
			}
			if agentInfo.AgentClients.WebSearchEnabled {
				agentTools = append(agentTools, responses.ToolParamOfWebSearchPreview(responses.WebSearchToolTypeWebSearchPreview))
			}

			req.Tools = agentTools
			req.ToolChoice = responses.ResponseNewParamsToolChoiceUnion{
				OfToolChoiceMode: param.NewOpt(responses.ToolChoiceOptionsAuto),
			}
		}

		respStream := client.Responses.NewStreaming(ctx, req)
		defer respStream.Close()

		isLeadingReturn := true
		for respStream.Next() {
			flushThink := flushData.(func(string, string, io.Writer, string) error)
			response := respStream.Current()
			switch variant := response.AsAny().(type) {
			case responses.ResponseTextDeltaEvent:
				data := variant.Delta
				if isLeadingReturn && len(data) != 0 {
					if strings.Count(data, "\n") == len(data) {
						continue
					} else {
						isLeadingReturn = false
					}
				}

				err = flushThink(data, "message", writer, lang)
				if err != nil {
					return nil, err
				}
			case responses.ResponseOutputItemDoneEvent:
				switch v := variant.Item.AsAny().(type) {
				case responses.ResponseFunctionToolCall:
					toolCalls = append(toolCalls, v)
				case responses.ResponseFunctionWebSearch:
					if v.Action.Type != "" {
						switch v.Action.Type {
						case "open_page":
							//err = flushThink(v.Action.URL, "tool_call", writer, lang)
							//if err != nil {
							//	return nil, err
							//}
						}
					}
				}
			case responses.ResponseCompletedEvent:
				modelResult.ResponseTokenCount = int(variant.Response.Usage.OutputTokens)
				modelResult.PromptTokenCount = int(variant.Response.Usage.InputTokens)
				modelResult.TotalTokenCount = int(variant.Response.Usage.TotalTokens)
				break
			}
		}
		if respStream.Err() != nil {
			return nil, respStream.Err()
		}

		if agentInfo != nil && agentInfo.AgentMessages != nil {
			agentInfo.AgentMessages.ToolCalls = toolCalls
		}

		err = CalculateOpenAIModelPrice(p.subType, modelResult, lang)
		if err != nil {
			return nil, err
		}
		return modelResult, nil
	} else if getOpenAiModelType(p.subType) == "imagesGenerations" {
		if strings.HasPrefix(question, "$CasibaseDryRun$") {
			return modelResult, nil
		}
		quality := getGenerateImageQuality(p.subType)
		reqUrl := openai.ImageGenerateParams{
			Prompt:         question,
			Model:          model,
			Size:           openai.ImageGenerateParamsSize1024x1024,
			ResponseFormat: openai.ImageGenerateParamsResponseFormatURL,
			Quality:        quality,
			N:              param.NewOpt[int64](1),
		}

		respUrl, err := client.Images.Generate(ctx, reqUrl)
		if err != nil {
			return nil, err
		}

		url := fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", respUrl.Data[0].URL)
		fmt.Fprint(writer, url)
		flusher.Flush()

		modelResult.ImageCount = 1
		modelResult.TotalTokenCount = modelResult.ImageCount
		err = CalculateOpenAIModelPrice(p.subType, modelResult, lang)
		if err != nil {
			return nil, err
		}

		return modelResult, nil
	} else if getOpenAiModelType(p.subType) == "Completion" {
		respStream := client.Completions.NewStreaming(ctx, openai.CompletionNewParams{
			Prompt: openai.CompletionNewParamsPromptUnion{
				OfString: param.Opt[string]{Value: question},
			},
			Model:            openai.CompletionNewParamsModel(model),
			Temperature:      param.NewOpt[float64](float64(temperature)),
			TopP:             param.NewOpt[float64](float64(topP)),
			FrequencyPenalty: param.NewOpt[float64](float64(frequencyPenalty)),
			PresencePenalty:  param.NewOpt[float64](float64(presencePenalty)),
		})
		defer respStream.Close()

		isLeadingReturn := true
		var response strings.Builder

		for respStream.Next() {
			completion := respStream.Current()

			data := completion.Choices[0].Text
			if isLeadingReturn && len(data) != 0 {
				if strings.Count(data, "\n") == len(data) {
					continue
				} else {
					isLeadingReturn = false
				}
			}

			flushStandard := flushData.(func(string, io.Writer, string) error)
			err := flushStandard(data, writer, lang)
			if err != nil {
				return nil, err
			}

			_, err = response.WriteString(data)
			if err != nil {
				return nil, err
			}

			if completion.Choices[0].FinishReason != "" {
				if completion.Choices[0].FinishReason == openai.CompletionChoiceFinishReasonStop {
					modelResult.PromptTokenCount = int(completion.Usage.PromptTokens)
					modelResult.ResponseTokenCount = int(completion.Usage.CompletionTokens)
					modelResult.TotalTokenCount = int(completion.Usage.TotalTokens)
					modelResult.Currency = "USD"
				} else {
					modelResult, err = getDefaultModelResult(p.subType, question, response.String())
					if err != nil {
						return nil, err
					}
				}
				break
			}
		}

		if respStream.Err() != nil {
			return nil, respStream.Err()
		}

		return modelResult, nil
	} else {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:QueryText() error: unknown model type: %s"), p.subType)
	}
}
