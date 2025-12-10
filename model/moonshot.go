// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

	"github.com/casibase/casibase/i18n"
	"github.com/northes/go-moonshot"
)

type MoonshotModelProvider struct {
	temperature float64
	subType     string
	secretKey   string
}

func NewMoonshotModelProvider(subType string, secretKey string, temperature float64) (*MoonshotModelProvider, error) {
	client := &MoonshotModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		temperature: temperature,
	}
	return client, nil
}

func (p *MoonshotModelProvider) GetPricing() string {
	return `URL: 
	https://platform.moonshot.cn/docs/pricing/chat

Model

| Model                  | Unit Of Charge | Input Price | Output Price |
|------------------------|----------------|-------------|--------------|
| moonshot-v1-8k         | 1M tokens      | 2 yuan      | 10 yuan      |
| moonshot-v1-32k        | 1M tokens      | 5 yuan      | 20 yuan      |
| moonshot-v1-128k       | 1M tokens      | 10 yuan     | 30 yuan      |
| kimi-k2-0905-preview   | 1M tokens      | 4 yuan      | 16 yuan      |
| kimi-k2-0711-preview   | 1M tokens      | 4 yuan      | 16 yuan      |
| kimi-k2-turbo-preview  | 1M tokens      | 8 yuan      | 58 yuan      |
| kimi-k2-thinking       | 1M tokens      | 4 yuan      | 16 yuan      |
| kimi-k2-thinking-turbo | 1M tokens      | 8 yuan      | 58 yuan      |
| kimi-latest            | 1M tokens      | Auto (Tier) | Auto (Tier)  |
`
}

func (p *MoonshotModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"moonshot-v1-8k":   {0.002, 0.010},
		"moonshot-v1-32k":  {0.005, 0.020},
		"moonshot-v1-128k": {0.010, 0.030},

		"kimi-k2-0905-preview": {0.004, 0.016},
		"kimi-k2-0711-preview": {0.004, 0.016},
		"kimi-k2-thinking":     {0.004, 0.016},

		"kimi-k2-turbo-preview":  {0.008, 0.058},
		"kimi-k2-thinking-turbo": {0.008, 0.058},
	}

	var priceItem [2]float64
	var ok bool

	if p.subType == "kimi-latest" {
		if modelResult.TotalTokenCount <= 8192 {
			priceItem = [2]float64{0.002, 0.010}
		} else if modelResult.TotalTokenCount <= 32768 {
			priceItem = [2]float64{0.005, 0.020}
		} else {
			priceItem = [2]float64{0.010, 0.030}
		}
		ok = true
	} else {
		priceItem, ok = priceTable[p.subType]
	}

	if ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "model:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *MoonshotModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	_ = agentInfo

	if p.secretKey == "" {
		return nil, errors.New("missing moonshot_key")
	}
	cli, err := moonshot.NewClientWithConfig(
		moonshot.NewConfig(
			moonshot.WithAPIKey(p.secretKey),
		),
	)
	if err != nil {
		return nil, err
	}

	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:cannot calculate tokens"))
		}
		if getContextLength(p.subType) > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf(i18n.Translate(lang, "model:exceed max tokens"))
		}
	}

	messages := buildMoonshotMessages(question, history, prompt, knowledgeMessages)

	// Chat completions
	resp, err := cli.Chat().Completions(context.Background(), &moonshot.ChatCompletionsRequest{
		Model:       moonshot.ChatCompletionsModelID(p.subType),
		Messages:    messages,
		Temperature: p.temperature,
	})
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	err = flushData(resp.Choices[0].Message.Content)
	if err != nil {
		return nil, err
	}

	modelResult := &ModelResult{
		PromptTokenCount:   resp.Usage.PromptTokens,
		ResponseTokenCount: resp.Usage.CompletionTokens,
		TotalTokenCount:    resp.Usage.TotalTokens,
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}

func buildMoonshotMessages(question string, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) []*moonshot.ChatCompletionsMessage {
	messages := []*moonshot.ChatCompletionsMessage{}

	systemMsgs := getSystemMessages(prompt, knowledgeMessages)
	for _, msg := range systemMsgs {
		messages = append(messages, &moonshot.ChatCompletionsMessage{
			Role:    moonshot.RoleSystem,
			Content: msg.Text,
		})
	}

	for i := len(history) - 1; i >= 0; i-- {
		rawMessage := history[i]
		role := moonshot.RoleUser
		if rawMessage.Author == "AI" {
			role = moonshot.RoleAssistant
		}
		messages = append(messages, &moonshot.ChatCompletionsMessage{
			Role:    role,
			Content: rawMessage.Text,
		})
	}

	messages = append(messages, &moonshot.ChatCompletionsMessage{
		Role:    moonshot.RoleUser,
		Content: question,
	})

	return messages
}
