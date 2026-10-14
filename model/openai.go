// Copyright 2023 The OpenAgent Authors. All Rights Reserved.
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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/option"
	"github.com/openai/openai-go/v2/packages/param"
	"github.com/openai/openai-go/v2/responses"
	"github.com/openai/openai-go/v2/shared"
	"github.com/the-open-agent/openagent/i18n"
	"github.com/the-open-agent/openagent/proxy"
)

type OpenAiModelProvider struct {
	subType                      string
	secretKey                    string
	endpoint                     string
	temperature                  float32
	topP                         float32
	frequencyPenalty             float32
	presencePenalty              float32
	inputPricePerThousandTokens  float64
	outputPricePerThousandTokens float64
	currency                     string
}

func NewOpenAiModelProvider(subType string, secretKey string, endpoint string, temperature float32, topP float32, frequencyPenalty float32, presencePenalty float32, inputPricePerThousandTokens float64, outputPricePerThousandTokens float64, currency string) (*OpenAiModelProvider, error) {
	p := &OpenAiModelProvider{
		subType:                      subType,
		secretKey:                    secretKey,
		endpoint:                     endpoint,
		temperature:                  temperature,
		topP:                         topP,
		frequencyPenalty:             frequencyPenalty,
		presencePenalty:              presencePenalty,
		inputPricePerThousandTokens:  inputPricePerThousandTokens,
		outputPricePerThousandTokens: outputPricePerThousandTokens,
		currency:                     currency,
	}
	return p, nil
}

func CalculateOpenAIModelPrice(model string, modelResult *ModelResult, lang string) error {
	var inputPricePerThousandTokens, outputPricePerThousandTokens float64

	switch {
	// Image generation models are billed per token, except gpt-image-1 which is billed per image
	case strings.Contains(model, "gpt-image-2"):
		// covers gpt-image-2, gpt-image-2.5-sunburst and gpt-image-2.5-flare
		inputPricePerThousandTokens = 0.005
		outputPricePerThousandTokens = 0.030
		modelResult.Currency = "USD"

	case strings.Contains(model, "gpt-image-1.5") || model == "chatgpt-image-latest":
		inputPricePerThousandTokens = 0.005
		outputPricePerThousandTokens = 0.010
		modelResult.Currency = "USD"

	case strings.Contains(model, "gpt-image-1-mini"):
		inputPricePerThousandTokens = 0.002
		outputPricePerThousandTokens = 0.008
		modelResult.Currency = "USD"

	case strings.Contains(model, "gpt-image-1"):
		inputPricePerThousandTokens = 0.005
		outputPricePerThousandTokens = 0.040
		modelResult.Currency = "USD"

	// gpt-6 series
	case strings.Contains(model, "gpt-6"):
		inputPricePerThousandTokens = 0.010
		outputPricePerThousandTokens = 0.050
		modelResult.Currency = "USD"

	// Cybersecurity models (gpt-5.6-cyber / gpt-5.5-cyber)
	case strings.Contains(model, "-cyber"):
		inputPricePerThousandTokens = 0.0125
		outputPricePerThousandTokens = 0.075
		modelResult.Currency = "USD"

	// Life sciences model
	case strings.Contains(model, "rosalind"):
		inputPricePerThousandTokens = 0.005
		outputPricePerThousandTokens = 0.025
		modelResult.Currency = "USD"

	// gpt 5.6 series
	case strings.Contains(model, "gpt-5.6"):
		if strings.Contains(model, "5.6-luna") {
			inputPricePerThousandTokens = 0.0002
			outputPricePerThousandTokens = 0.0012
		} else if strings.Contains(model, "5.6-terra") {
			inputPricePerThousandTokens = 0.002
			outputPricePerThousandTokens = 0.012
		} else {
			// gpt-5.6-sol
			inputPricePerThousandTokens = 0.004
			outputPricePerThousandTokens = 0.020
		}
		modelResult.Currency = "USD"

	// gpt 5.5 series
	case strings.Contains(model, "gpt-5.5"):
		if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.030
			outputPricePerThousandTokens = 0.180
		} else {
			inputPricePerThousandTokens = 0.005
			outputPricePerThousandTokens = 0.030
		}
		modelResult.Currency = "USD"

	// gpt 5.4 series
	case strings.Contains(model, "gpt-5.4"):
		if strings.Contains(model, "5.4-mini") {
			inputPricePerThousandTokens = 0.00075
			outputPricePerThousandTokens = 0.0045
		} else if strings.Contains(model, "5.4-nano") {
			inputPricePerThousandTokens = 0.0002
			outputPricePerThousandTokens = 0.00125
		} else if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.030
			outputPricePerThousandTokens = 0.180
		} else {
			inputPricePerThousandTokens = 0.0025
			outputPricePerThousandTokens = 0.015
		}
		modelResult.Currency = "USD"

	// gpt 5.3 / 5.2 series (gpt-5.3-codex shares the gpt-5.2 rate)
	case strings.Contains(model, "gpt-5.3") || strings.Contains(model, "gpt-5.2"):
		if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.021
			outputPricePerThousandTokens = 0.168
		} else {
			inputPricePerThousandTokens = 0.00175
			outputPricePerThousandTokens = 0.014
		}
		modelResult.Currency = "USD"

	// gpt 5.1 series
	case strings.Contains(model, "gpt-5.1"):
		inputPricePerThousandTokens = 0.00125
		outputPricePerThousandTokens = 0.010
		modelResult.Currency = "USD"

	// gpt 5 series
	case strings.Contains(model, "gpt-5"):
		if strings.Contains(model, "mini") {
			inputPricePerThousandTokens = 0.00025
			outputPricePerThousandTokens = 0.002
		} else if strings.Contains(model, "nano") {
			inputPricePerThousandTokens = 0.00005
			outputPricePerThousandTokens = 0.0004
		} else if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.015
			outputPricePerThousandTokens = 0.120
		} else {
			inputPricePerThousandTokens = 0.00125
			outputPricePerThousandTokens = 0.010
		}
		modelResult.Currency = "USD"

	// chat-latest
	case model == "chat-latest":
		inputPricePerThousandTokens = 0.005
		outputPricePerThousandTokens = 0.030
		modelResult.Currency = "USD"

	// gpt 4.1 series
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

	// gpt 4 series
	case strings.Contains(model, "gpt-4"):
		if strings.Contains(model, "turbo") {
			inputPricePerThousandTokens = 0.010
			outputPricePerThousandTokens = 0.030
		} else if strings.Contains(model, "4o-mini") {
			inputPricePerThousandTokens = 0.00015
			outputPricePerThousandTokens = 0.0006
		} else if strings.Contains(model, "4o") {
			inputPricePerThousandTokens = 0.0025
			outputPricePerThousandTokens = 0.010
		} else {
			inputPricePerThousandTokens = 0.030
			outputPricePerThousandTokens = 0.060
		}
		modelResult.Currency = "USD"

	// gpt 3.5 turbo
	case strings.Contains(model, "gpt-3.5"):
		inputPricePerThousandTokens = 0.0005
		outputPricePerThousandTokens = 0.0015
		modelResult.Currency = "USD"

	// o1 reasoning models
	case strings.Contains(model, "o1"):
		if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.150
			outputPricePerThousandTokens = 0.600
		} else {
			inputPricePerThousandTokens = 0.015
			outputPricePerThousandTokens = 0.060
		}
		modelResult.Currency = "USD"

	// o3 reasoning models
	case strings.Contains(model, "o3"):
		if strings.Contains(model, "mini") {
			inputPricePerThousandTokens = 0.0011
			outputPricePerThousandTokens = 0.0044
		} else if strings.Contains(model, "pro") {
			inputPricePerThousandTokens = 0.020
			outputPricePerThousandTokens = 0.080
		} else {
			inputPricePerThousandTokens = 0.002
			outputPricePerThousandTokens = 0.008
		}
		modelResult.Currency = "USD"

	// o4 reasoning models
	case strings.Contains(model, "o4"):
		inputPricePerThousandTokens = 0.0011
		outputPricePerThousandTokens = 0.0044
		modelResult.Currency = "USD"

	default:
		// For unknown models, set price to 0 instead of returning error
		inputPricePerThousandTokens = 0
		outputPricePerThousandTokens = 0
		modelResult.Currency = "USD"
	}

	inputPrice := getPrice(modelResult.PromptTokenCount, inputPricePerThousandTokens)
	outputPrice := getPrice(modelResult.ResponseTokenCount, outputPricePerThousandTokens)
	modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
	return nil
}

func getOpenAIModelPrice() string {
	return `URL:
https://developers.openai.com/api/docs/pricing

Language models (per 1,000 tokens):

| Models                  | Context | Input     | Output    |
|-------------------------|---------|-----------|-----------|
| GPT-6-Astra             | 1050K   | $0.010    | $0.050    |
| GPT-5.6-Sol             | 1050K   | $0.004    | $0.020    |
| GPT-5.6-Terra           | 1050K   | $0.002    | $0.012    |
| GPT-5.6-Luna            | 1050K   | $0.0002   | $0.0012   |
| GPT-5.6-Cyber           | 1050K   | $0.0125   | $0.075    |
| GPT-5.5-Cyber           | 1050K   | $0.0125   | $0.075    |
| GPT-Rosalind-Research   | 400K    | $0.005    | $0.025    |
| GPT-5.5                 | 1050K   | $0.005    | $0.030    |
| GPT-5.5-Pro             | 1050K   | $0.030    | $0.180    |
| GPT-5.4                 | 400K    | $0.0025   | $0.015    |
| GPT-5.4-mini            | 400K    | $0.00075  | $0.0045   |
| GPT-5.4-nano            | 400K    | $0.0002   | $0.00125  |
| GPT-5.4-Pro             | 400K    | $0.030    | $0.180    |
| GPT-5.3-Codex           | 400K    | $0.00175  | $0.014    |
| GPT-5.2                 | 400K    | $0.00175  | $0.014    |
| GPT-5.2-Pro             | 400K    | $0.021    | $0.168    |
| GPT-5.1                 | 400K    | $0.00125  | $0.010    |
| GPT-5                   | 400K    | $0.00125  | $0.010    |
| GPT-5-mini              | 400K    | $0.00025  | $0.002    |
| GPT-5-nano              | 400K    | $0.00005  | $0.0004   |
| GPT-5-Pro               | 400K    | $0.015    | $0.120    |
| GPT-5-Search-API        | 400K    | $0.00125  | $0.010    |
| chat-latest             | 400K    | $0.005    | $0.030    |
| GPT-4.1                 | 100K    | $0.002    | $0.008    |
| GPT-4.1-mini            | 100K    | $0.0004   | $0.0016   |
| GPT-4.1-nano            | 100K    | $0.0001   | $0.0004   |
| GPT-4o                  | 128K    | $0.0025   | $0.010    |
| GPT-4o-mini             | 128K    | $0.00015  | $0.0006   |
| GPT-4-Turbo             | 128K    | $0.010    | $0.030    |
| GPT-4                   | 8K      | $0.030    | $0.060    |
| GPT-3.5-Turbo           | 16K     | $0.0005   | $0.0015   |
| o1                      | 200K    | $0.015    | $0.060    |
| o1-pro                  | 200K    | $0.150    | $0.600    |
| o3                      | 200K    | $0.002    | $0.008    |
| o3-pro                  | 200K    | $0.020    | $0.080    |
| o3-mini                 | 200K    | $0.0011   | $0.0044   |
| o4-mini                 | 200K    | $0.0011   | $0.0044   |

Image generation models (token-based, per 1,000 tokens):

| Model                   | Input     | Output    |
|-------------------------|-----------|-----------|
| GPT-Image-2.5-Sunburst  | $0.005    | $0.030    |
| GPT-Image-2.5-Flare     | $0.005    | $0.030    |
| GPT-Image-2             | $0.005    | $0.030    |
| GPT-Image-1.5           | $0.005    | $0.010    |
| GPT-Image-1-Mini        | $0.002    | $0.008    |
| GPT-Image-1             | $0.005    | $0.040    |
| ChatGPT-Image-Latest    | $0.005    | $0.010    |
`
}

func (p *OpenAiModelProvider) GetPricing() string {
	return getOpenAIModelPrice()
}

func (p *OpenAiModelProvider) ListModels() ([]string, error) {
	url := p.endpoint
	if url == "" {
		url = "https://api.openai.com/v1"
	}
	return openaiCompatibleListModels("openai", p.secretKey, url)
}

func GetOpenAiClientFromToken(authToken string) openai.Client {
	return newOpenAiClient(authToken, "")
}

func newOpenAiClient(authToken, endpoint string) openai.Client {
	opts := []option.RequestOption{
		option.WithAPIKey(authToken),
	}
	if proxy.ProxyHttpClient != nil {
		opts = append(opts, option.WithHTTPClient(proxy.ProxyHttpClient))
	}
	if endpoint != "" {
		opts = append(opts, option.WithBaseURL(endpoint))
	}
	return openai.NewClient(opts...)
}

func (p *OpenAiModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, toolSession *ToolSession, lang string) (*ModelResult, error) {
	var client openai.Client
	var flushData interface{}

	client = newOpenAiClient(p.secretKey, p.endpoint)
	flushData = flushDataThink

	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	model := p.subType
	temperature := p.temperature
	topP := p.topP
	frequencyPenalty := p.frequencyPenalty
	presencePenalty := p.presencePenalty

	maxTokens := getContextLength(model)

	modelResult := &ModelResult{}
	modelType := getOpenAiModelType(model)
	if modelType == "Chat" {
		rawMessages, err := OpenaiGenerateMessages(prompt, question, history, knowledgeMessages, model, maxTokens, lang)
		if err != nil {
			return nil, err
		}
		if toolSession != nil && toolSession.ToolMessages != nil && toolSession.ToolMessages.Messages != nil {
			rawMessages = append(rawMessages, toolSession.ToolMessages.Messages...)
		}

		var messages responses.ResponseInputParam
		var toolCalls []responses.ResponseFunctionToolCall

		if IsVisionModel(model) {
			messages, err = openaiRawMessagesToGptVisionMessages(rawMessages)
			if err != nil {
				return nil, err
			}
		} else {
			messages = openaiRawMessagesToMessages(rawMessages)
		}

		if strings.HasPrefix(question, "$OpenAgentDryRun$") {
			promptTokenCount, err := openaiNumTokensFromMessages(messages, model)
			if err != nil {
				return nil, err
			}

			modelResult.PromptTokenCount = promptTokenCount
			modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount
			err = CalculateOpenAIModelPrice(model, modelResult, lang)
			if err != nil {
				return nil, err
			}

			if getContextLength(model) > modelResult.TotalTokenCount {
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
		// Only send Reasoning param to official OpenAI endpoints; compatible providers reject it
		if p.endpoint == "" {
			req.Reasoning = shared.ReasoningParam{Summary: "auto"}
		}
		if toolSession != nil && toolSession.McpToolSet != nil {
			agentTools, err := reverseMcpToolsToOpenAi(toolSession.McpToolSet.Tools)
			if err != nil {
				return nil, err
			}
			if toolSession.McpToolSet.WebSearchEnabled {
				agentTools = append(agentTools, responses.ToolParamOfWebSearchPreview(responses.WebSearchToolTypeWebSearchPreview))
			}

			req.Tools = agentTools
			req.ToolChoice = responses.ResponseNewParamsToolChoiceUnion{
				OfToolChoiceMode: param.NewOpt(responses.ToolChoiceOptionsAuto),
			}
		}

		flushThink := flushData.(func(string, string, io.Writer, string) error)

		respStream := client.Responses.NewStreaming(ctx, req)
		defer respStream.Close()

		isLeadingReturn := true
		for respStream.Next() {
			response := respStream.Current()
			switch variant := response.AsAny().(type) {
			case responses.ResponseReasoningSummaryTextDeltaEvent:
				data := variant.Delta
				err = flushThink(data, "reason", writer, lang)
				if err != nil {
					return nil, err
				}
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
			case responses.ResponseOutputItemAddedEvent:
				switch v := variant.Item.AsAny().(type) {
				case responses.ResponseFunctionToolCall:
					err = flushToolCallDelta(int(variant.OutputIndex), v.ID, v.Name, "", writer, lang)
					if err != nil {
						return nil, err
					}
				}
			case responses.ResponseFunctionCallArgumentsDeltaEvent:
				err = flushToolCallDelta(int(variant.OutputIndex), variant.ItemID, "", variant.Delta, writer, lang)
				if err != nil {
					return nil, err
				}
			case responses.ResponseOutputItemDoneEvent:
				switch v := variant.Item.AsAny().(type) {
				case responses.ResponseOutputItemImageGenerationCall:
					if v.Status == "completed" && v.Result != "" {
						imgTag := fmt.Sprintf(`<img src="data:image/png;base64,%s" width="100%%" height="auto">`, v.Result)
						err = flushThink(imgTag, "message", writer, lang)
						if err != nil {
							return nil, err
						}
						modelResult.ImageCount++
					}
				case responses.ResponseFunctionToolCall:
					toolCalls = append(toolCalls, v)
				case responses.ResponseOutputMessage:
					if v.Status == "completed" {
						for _, contentItem := range v.Content {
							if contentItem.Type != "output_text" || len(contentItem.Annotations) == 0 {
								continue
							}
							var searchResults []SearchResult
							for idx, annotation := range contentItem.Annotations {
								searchResults = append(searchResults, SearchResult{
									Index: idx + 1,
									URL:   annotation.URL,
									Title: annotation.Title,
								})
							}
							searchResultsJSON, _ := json.Marshal(searchResults)
							flushDataThink(string(searchResultsJSON), "search", writer, lang)
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

		if toolSession != nil && toolSession.ToolMessages != nil {
			toolSession.ToolMessages.ToolCalls = toolCalls
		}

		if p.inputPricePerThousandTokens > 0 || p.outputPricePerThousandTokens > 0 {
			inputPrice := getPrice(modelResult.PromptTokenCount, p.inputPricePerThousandTokens)
			outputPrice := getPrice(modelResult.ResponseTokenCount, p.outputPricePerThousandTokens)
			modelResult.TotalPrice = AddPrices(inputPrice, outputPrice)
			modelResult.Currency = p.currency
		} else {
			err = CalculateOpenAIModelPrice(model, modelResult, lang)
			if err != nil {
				return nil, err
			}
		}
		return modelResult, nil
	} else if modelType == "ImageGeneration" {
		if strings.HasPrefix(question, "$OpenAgentDryRun$") {
			return modelResult, nil
		}
		quality := getGenerateImageQuality(model)
		reqGen := openai.ImageGenerateParams{
			Prompt:  question,
			Model:   model,
			Size:    openai.ImageGenerateParamsSize1024x1024,
			Quality: quality,
			N:       param.NewOpt[int64](1),
		}
		// The gpt-image models reject response_format and return base64-encoded image data
		// by default. DALL-E, the only family that accepted it, was shut down in May 2026.

		respUrl, err := client.Images.Generate(ctx, reqGen)
		if err != nil {
			return nil, err
		}

		imgSrc, err := openaiImageHTMLSrc(respUrl)
		if err != nil {
			return nil, err
		}
		url := fmt.Sprintf("<img src=\"%s\" width=\"100%%\" height=\"auto\">", imgSrc)
		fmt.Fprint(writer, url)
		flusher.Flush()

		modelResult.ImageCount = 1
		modelResult.TotalTokenCount = modelResult.ImageCount
		err = CalculateOpenAIModelPrice(model, modelResult, lang)
		if err != nil {
			return nil, err
		}

		return modelResult, nil
	} else if getOpenAiModelType(model) == "Completion" {
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
					modelResult, err = getDefaultModelResult(model, question, response.String())
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
		return nil, fmt.Errorf(i18n.Translate(lang, "model:QueryText() error: unknown model type: %s"), model)
	}
}

func openaiImageHTMLSrc(resp *openai.ImagesResponse) (string, error) {
	if resp == nil || len(resp.Data) == 0 {
		return "", fmt.Errorf("empty image generation response")
	}
	img := resp.Data[0]
	if img.URL != "" {
		return img.URL, nil
	}
	if img.B64JSON == "" {
		return "", fmt.Errorf("no image URL or base64 payload in response")
	}
	mime := "image/png"
	switch resp.OutputFormat {
	case openai.ImagesResponseOutputFormatWebP:
		mime = "image/webp"
	case openai.ImagesResponseOutputFormatJPEG:
		mime = "image/jpeg"
	}
	return fmt.Sprintf("data:%s;base64,%s", mime, img.B64JSON), nil
}

func getGenerateImageQuality(model string) openai.ImageGenerateParamsQuality {
	if strings.HasPrefix(model, "gpt-image-1") {
		return openai.ImageGenerateParamsQualityHigh
	}
	return openai.ImageGenerateParamsQualityAuto
}

func openaiRawMessagesToMessages(messages []*RawMessage) responses.ResponseInputParam {
	var res responses.ResponseInputParam
	for _, message := range messages {
		if message.Text == "" {
			message.Text = " "
		}
		var role responses.EasyInputMessageRole
		if message.Author == "AI" {
			role = responses.EasyInputMessageRoleAssistant
			if message.ToolCall.ID != "" {
				item := responses.ResponseInputItemUnionParam{
					OfFunctionCall: &responses.ResponseFunctionToolCallParam{
						Arguments: message.ToolCall.Function.Arguments,
						Name:      message.ToolCall.Function.Name,
						CallID:    message.ToolCall.ID,
					},
				}
				res = append(res, item)
			} else {
				item := responses.ResponseInputItemUnionParam{
					OfOutputMessage: &responses.ResponseOutputMessageParam{
						Content: []responses.ResponseOutputMessageContentUnionParam{
							{
								OfOutputText: &responses.ResponseOutputTextParam{
									Text: message.Text,
								},
							},
						},
					},
				}
				res = append(res, item)
			}
			continue
		} else if message.Author == "System" {
			role = responses.EasyInputMessageRoleSystem
		} else if message.Author == "Tool" {
			item := responses.ResponseInputItemUnionParam{
				OfFunctionCallOutput: &responses.ResponseInputItemFunctionCallOutputParam{
					CallID: message.ToolCallID,
					Output: message.Text,
				},
			}
			res = append(res, item)
			continue
		} else {
			role = responses.EasyInputMessageRoleUser
		}

		item := responses.ResponseInputItemUnionParam{
			OfMessage: &responses.EasyInputMessageParam{
				Content: responses.EasyInputMessageContentUnionParam{
					OfString: param.NewOpt[string](message.Text),
				},
				Role: role,
			},
		}
		res = append(res, item)
	}
	return res
}

func openaiRawMessagesToGptVisionMessages(messages []*RawMessage) (responses.ResponseInputParam, error) {
	var res responses.ResponseInputParam
	for _, message := range messages {
		var role responses.EasyInputMessageRole
		if message.Author == "AI" {
			role = responses.EasyInputMessageRoleAssistant
			if message.ToolCall.ID != "" {
				item := responses.ResponseInputItemUnionParam{
					OfFunctionCall: &responses.ResponseFunctionToolCallParam{
						Arguments: message.ToolCall.Function.Arguments,
						Name:      message.ToolCall.Function.Name,
						CallID:    message.ToolCall.ID,
					},
				}
				res = append(res, item)
			} else {
				item := responses.ResponseInputItemUnionParam{
					OfOutputMessage: &responses.ResponseOutputMessageParam{
						Content: []responses.ResponseOutputMessageContentUnionParam{
							{
								OfOutputText: &responses.ResponseOutputTextParam{
									Text: message.Text,
								},
							},
						},
					},
				}
				res = append(res, item)
			}
			continue
		} else if message.Author == "System" {
			role = responses.EasyInputMessageRoleSystem
		} else if message.Author == "Tool" {
			item := responses.ResponseInputItemUnionParam{
				OfFunctionCallOutput: &responses.ResponseInputItemFunctionCallOutputParam{
					CallID: message.ToolCallID,
					Output: message.Text,
				},
			}
			res = append(res, item)
			continue
		} else {
			role = responses.EasyInputMessageRoleUser
		}

		// OpenAI's Responses API rejects `input_image` on system messages
		// (only `input_text` is allowed there). Keep any URLs inline as text
		// for the system role so the model still sees them.
		var urls []string
		messageText := message.Text
		if role != responses.EasyInputMessageRoleSystem {
			urls, messageText = extractImagesURL(message.Text)
		}
		images, messageText := getImageRefinedTexts(urls, messageText)

		var itemContentList responses.ResponseInputMessageContentListParam
		if len(messageText) > 0 {
			if messageText == "" {
				messageText = " "
			}
			itemContentList = append(itemContentList, responses.ResponseInputContentUnionParam{
				OfInputText: &responses.ResponseInputTextParam{
					Text: messageText,
				},
			})
		}
		for _, imageText := range images {
			itemContentList = append(itemContentList, responses.ResponseInputContentUnionParam{
				OfInputImage: &responses.ResponseInputImageParam{
					ImageURL: param.NewOpt[string](imageText),
				},
			})
		}
		for _, image := range message.Images {
			itemContentList = append(itemContentList, responses.ResponseInputContentUnionParam{
				OfInputImage: &responses.ResponseInputImageParam{
					ImageURL: param.NewOpt[string](fmt.Sprintf(
						"data:%s;base64,%s",
						image.MimeType,
						base64.StdEncoding.EncodeToString(image.Data),
					)),
				},
			})
		}

		content := responses.EasyInputMessageContentUnionParam{
			OfInputItemContentList: itemContentList,
		}

		item := responses.ResponseInputItemUnionParam{
			OfMessage: &responses.EasyInputMessageParam{
				Content: content,
				Role:    role,
			},
		}
		res = append(res, item)
	}
	return res, nil
}

func openaiNumTokensFromMessages(messages responses.ResponseInputParam, model string) (int, error) {
	modelToUse := getCompatibleModel(model)
	// Get model-specific token counts
	tokensPerMessage, _ := getModelTokenCounts(modelToUse)

	// Get tiktoken encoding using the compatibility layer
	tkm, err := getTiktoken(modelToUse)
	if err != nil {
		return 0, err
	}

	numTokens := 0
	for _, message := range messages {
		// Calculate tokens for the message content
		var content string
		var role string
		if message.OfMessage != nil {
			content = message.OfMessage.Content.OfString.String()
			for _, multiContentPart := range message.OfMessage.Content.OfInputItemContentList {
				if multiContentPart.OfInputText != nil {
					content += multiContentPart.OfInputText.Text
				}
			}
			role = string(message.OfMessage.Role)
		} else if message.OfOutputMessage != nil {
			for _, multiContentPart := range message.OfOutputMessage.Content {
				if multiContentPart.OfOutputText != nil {
					content += multiContentPart.OfOutputText.Text
				}
			}
			role = string(message.OfOutputMessage.Role)
		}

		numTokens += tokensPerMessage
		numTokens += len(tkm.Encode(content, nil, nil))
		numTokens += len(tkm.Encode(role, nil, nil))
	}

	numTokens += 3 // every reply is primed with <|start|>assistant<|message|>
	return numTokens, nil
}

func reverseMcpToolsToOpenAi(tools []*protocol.Tool) ([]responses.ToolUnionParam, error) {
	var openaiTools []responses.ToolUnionParam
	for _, tool := range tools {
		schemaBytes, err := json.Marshal(tool.InputSchema)
		if err != nil {
			return nil, err
		}

		var parameters map[string]interface{}
		if err := json.Unmarshal(schemaBytes, &parameters); err != nil {
			return nil, err
		}
		normalizeToolParametersSchema(parameters)
		openaiTools = append(openaiTools, responses.ToolUnionParam{
			OfFunction: &responses.FunctionToolParam{
				Type:        "function",
				Name:        tool.Name,
				Description: param.NewOpt[string](tool.Description),
				Parameters:  parameters,
			},
		})
	}
	return openaiTools, nil
}
