// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"log"
	"net/http"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/proxy"
)

type MiniMaxModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewMiniMaxModelProvider(subType string, apiKey string, temperature float32, topP float32) (*MiniMaxModelProvider, error) {
	return &MiniMaxModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *MiniMaxModelProvider) GetPricing() string {
	return `URL:
https://platform.minimaxi.com/document/price

| Model                    | Input Price            | Output Price           |
|--------------------------|------------------------|------------------------|
| MiniMax-M2.7             | 2.1 CNY/1M tokens      | 8.4 CNY/1M tokens      |
| MiniMax-M2.7-highspeed   | 4.2 CNY/1M tokens      | 16.8 CNY/1M tokens     |
| MiniMax-M2.5             | 2.1 CNY/1M tokens      | 8.4 CNY/1M tokens      |
| MiniMax-M2.5-highspeed   | 4.2 CNY/1M tokens      | 16.8 CNY/1M tokens     |
| M2-her                   | 2.1 CNY/1M tokens      | 8.4 CNY/1M tokens      |
`
}

type minimaxPrice struct {
	inputPerK  float64
	outputPerK float64
}

func (p *MiniMaxModelProvider) calculatePrice(modelResult *ModelResult) error {
	priceTable := map[string]minimaxPrice{
		"MiniMax-M2.7":           {inputPerK: 0.0021, outputPerK: 0.0084},
		"MiniMax-M2.7-highspeed": {inputPerK: 0.0042, outputPerK: 0.0168},
		"MiniMax-M2.5":           {inputPerK: 0.0021, outputPerK: 0.0084},
		"MiniMax-M2.5-highspeed": {inputPerK: 0.0042, outputPerK: 0.0168},
		"M2-her":                 {inputPerK: 0.0021, outputPerK: 0.0084},
		"abab6":                  {inputPerK: 0.1, outputPerK: 0.1},
		"abab5.5":                {inputPerK: 0.015, outputPerK: 0.015},
		"abab5-chat":             {inputPerK: 0.015, outputPerK: 0.015},
		"abab5.5s":               {inputPerK: 0.005, outputPerK: 0.005},
	}

	if mp, ok := priceTable[p.subType]; ok {
		modelResult.TotalPrice = getPrice(modelResult.PromptTokenCount, mp.inputPerK) +
			getPrice(modelResult.ResponseTokenCount, mp.outputPerK)
	} else {
		log.Printf("[WARN] MiniMax: unknown model %q, price set to 0", p.subType)
		modelResult.TotalPrice = 0
	}

	modelResult.Currency = "CNY"
	return nil
}

// getMinimaxMaxOutputTokens returns the maximum number of *output* tokens
// allowed by the MiniMax Anthropic-compatible API for the given model.
// This is distinct from the context window length (input + output).
// Reference: MiniMax Anthropic compatibility documentation.
func getMinimaxMaxOutputTokens(subType string) int {
	table := map[string]int{
		"MiniMax-M2.7":           16384,
		"MiniMax-M2.7-highspeed": 16384,
		"MiniMax-M2.5":           16384,
		"MiniMax-M2.5-highspeed": 16384,
		"M2-her":                 2048,
	}
	if v, ok := table[subType]; ok {
		return v
	}
	// Safe fallback for unknown models
	return 4096
}

func (p *MiniMaxModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	// Dry run support: estimate tokens and price without calling the API
	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:cannot calculate tokens"))
		}
		// Use the model-specific max *output* tokens for dry-run validation
		maxOutputTokens := getMinimaxMaxOutputTokens(p.subType)
		// The Anthropic API's MaxTokens parameter controls output tokens only.
		// For dry-run validation, we check if the estimated output is within limits.
		if maxOutputTokens > modelResult.TotalTokenCount {
			err := p.calculatePrice(modelResult)
			if err != nil {
				return nil, err
			}
			return modelResult, nil
		} else {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
		}
	}

	// Temperature & TopP constraints
	safeTemperature := p.temperature
	if safeTemperature <= 0.0 {
		safeTemperature = 0.01
	} else if safeTemperature > 1.0 {
		safeTemperature = 1.0
	}

	safeTopP := p.topP
	if safeTopP <= 0.0 {
		safeTopP = 0.95
	} else if safeTopP > 1.0 {
		safeTopP = 1.0
	}

	// Create a new client for each request to set the API key
	// Note: This is not ideal for performance, but the anthropic SDK client does not
	// have a method to change the API key after creation.
	// In the future, we could consider using a client pool or caching mechanism.
	client := anthropic.NewClient(
		option.WithBaseURL("https://api.minimaxi.com/anthropic"),
		option.WithAPIKey(p.apiKey),
		option.WithHTTPClient(proxy.ProxyHttpClient),
	)

	// Use the model-specific max *output* tokens, NOT the context window length.
	// The Anthropic API's MaxTokens parameter controls output tokens only.
	maxTokens := getMinimaxMaxOutputTokens(p.subType)

	var textBlockList []anthropic.TextBlockParam
	systemMessages := getSystemMessages(prompt, knowledgeMessages)
	for _, systemMessage := range systemMessages {
		textBlockList = append(textBlockList, anthropic.TextBlockParam{
			Text: systemMessage.Text,
			Type: "text",
		})
	}

	messages := []anthropic.MessageParam{}
	for i := len(history) - 1; i >= 0; i-- {
		historyMessage := history[i]
		messages = append(messages, anthropic.NewAssistantMessage(anthropic.NewTextBlock(historyMessage.Text)))
	}
	messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(question)))

	// Fix: Only set one of Temperature or TopP to comply with Anthropic API guidelines
	// "You should either alter temperature or top_p, but not both."
	messageParams := anthropic.MessageNewParams{
		MaxTokens: int64(maxTokens),
		Messages:  messages,
		Model:     anthropic.Model(p.subType),
		System:    textBlockList,
	}
	if safeTemperature != 1.0 { // Only set temperature if it's not the default
		messageParams.Temperature = anthropic.Float(float64(safeTemperature))
	} else if safeTopP != 0.95 { // Only set topP if it's not the default and temperature is default
		messageParams.TopP = anthropic.Float(float64(safeTopP))
	}

	stream := client.Messages.NewStreaming(context.TODO(), messageParams)

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	flushData := func(event string, data string) error {
		if _, err := fmt.Fprintf(writer, "event: %s\ndata: %s\n\n", event, data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	modelResult := &ModelResult{}
	textReceived := false // Flag to track if any text was received
	for stream.Next() {
		event := stream.Current()

		switch eventVariant := event.AsAny().(type) {
		case anthropic.MessageStartEvent:
			inputTokens := int(eventVariant.Message.Usage.InputTokens)
			modelResult.PromptTokenCount = inputTokens
		case anthropic.ContentBlockDeltaEvent:
			switch deltaVariant := eventVariant.Delta.AsAny().(type) {
			case anthropic.ThinkingDelta:
				err := flushData("reason", deltaVariant.Thinking)
				if err != nil {
					return nil, err
				}
			case anthropic.TextDelta:
				textReceived = true
				err := flushData("message", deltaVariant.Text)
				if err != nil {
					return nil, err
				}
			}
		case anthropic.MessageDeltaEvent:
			outputTokens := int(eventVariant.Usage.OutputTokens)
			modelResult.ResponseTokenCount = outputTokens
		}
	}

	if stream.Err() != nil {
		return nil, stream.Err()
	}
	modelResult.TotalTokenCount = modelResult.PromptTokenCount + modelResult.ResponseTokenCount

	// Add a safeguard to detect empty responses
	if !textReceived && modelResult.ResponseTokenCount == 0 {
		log.Printf("[WARN] MiniMax: empty response received for model %q", p.subType)
		// Return an error for empty responses to prevent silent failures
		return nil, fmt.Errorf(i18n.Translate(lang, "model:empty response received from MiniMax API"))
	}

	err := p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
