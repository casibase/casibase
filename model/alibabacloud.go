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
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/dashscopego"
	"github.com/casibase/dashscopego/qwen"
)

type AlibabacloudModelProvider struct {
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewAlibabacloudModelProvider(subType string, apiKey string, temperature float32, topP float32) (*AlibabacloudModelProvider, error) {
	return &AlibabacloudModelProvider{
		subType:     subType,
		apiKey:      apiKey,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (p *AlibabacloudModelProvider) GetPricing() string {
	return `URL:
https://help.aliyun.com/zh/model-studio/billing-for-model-studio

| Model               | sub-type                        | Input Price per 1K characters    | Output Price per 1K characters |
|---------------------|---------------------------------|----------------------------------|--------------------------------|
| Qwen-Long           | qwen-long                       | 0.0005yuan/1,000 tokens          | 0.002yuan/1,000 tokens         |
| Qwen-Turbo          | qwen-turbo                      | 0.002yuan/1,000 tokens           | 0.006yuan/1,000 tokens         |
| Qwen-Plus           | qwen-plus                       | 0.004yuan/1,000 tokens           | 0.012yuan/1,000 tokens         |
| Qwen-Max            | qwen-max                        | 0.04yuan/1,000 tokens            | 0.12yuan/1,000 tokens          |
| Qwen-Max            | qwen-max-longcontext            | 0.04yuan/1,000 tokens            | 0.12yuan/1,000 tokens          |
| Qwen3-235B-a22B     | qwen3-235b-a22b                 | 0.004yuan/1,000 tokens            | 0.04yuan/1,000 tokens         |
| Qwen3-32B           | qwen3-32b            			| 0.002yuan/1,000 tokens            | 0.02yuan/1,000 tokens         |
| DeepSeek-R1         | deepseek-r1                     | 0.004yuan/1,000 tokens           | 0.016yuan/1,000 tokens         |
| DeepSeek-V3         | deepseek-v3                     | 0.002yuan/1,000 tokens           | 0.008yuan/1,000 tokens         |
| DeepSeek-V3.1       | deepseek-v3.1                   | 0.004yuan/1,000 tokens           | 0.012yuan/1,000 tokens         |
| DeepSeek-V3.2       | deepseek-v3.2                   | 0.002yuan/1,000 tokens           | 0.003yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-1.5b   | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-7b     | 0.0005yuan/1,000 tokens          | 0.001yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-14b    | 0.001yuan/1,000 tokens           | 0.003yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-qwen-32b    | 0.002yuan/1,000 tokens           | 0.006yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-llama-8b    | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
| DeepSeek-R1-Distill | deepseek-r1-distill-llama-70b   | 0.000yuan/1,000 tokens           | 0.000yuan/1,000 tokens         |
`
}

func (p *AlibabacloudModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	priceTable := map[string][2]float64{
		"qwen-long":                     {0.0005, 0.002},
		"qwen-turbo":                    {0.002, 0.006},
		"qwen-plus":                     {0.004, 0.012},
		"qwen-max":                      {0.040, 0.120},
		"qwen-max-longcontext":          {0.040, 0.120},
		"qwen3-235b-a22b":               {0.004, 0.04},
		"qwen3-32b":                     {0.002, 0.02},
		"deepseek-r1":                   {0.004, 0.016},
		"deepseek-v3":                   {0.002, 0.008},
		"deepseek-v3.1":                 {0.004, 0.012},
		"deepseek-v3.2":                 {0.002, 0.003},
		"deepseek-r1-distill-qwen-1.5b": {0.000, 0.000},
		"deepseek-r1-distill-qwen-7b":   {0.001, 0.003},
		"deepseek-r1-distill-qwen-14b ": {0.002, 0.006},
		"deepseek-r1-distill-qwen-32b":  {0.000, 0.000},
		"deepseek-r1-distill-llama-8b":  {0.000, 0.000},
	}

	if priceItem, ok := priceTable[p.subType]; ok {
		inputPrice := getPrice(modelResult.PromptTokenCount, priceItem[0])
		outputPrice := getPrice(modelResult.ResponseTokenCount, priceItem[1])
		price = inputPrice + outputPrice
	} else {
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *AlibabacloudModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf(i18n.Translate(lang, "model:writer does not implement http.Flusher"))
	}

	cli := dashscopego.NewTongyiClient(p.subType, p.apiKey)

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

	params := qwen.DefaultParameters().
		SetTemperature(float64(p.temperature)).
		SetTopP(float64(p.topP)).
		SetIncrementalOutput(true)

	if agentInfo != nil && agentInfo.AgentClients != nil && agentInfo.AgentClients.WebSearchEnabled {
		params.SetEnableSearch(true)
		params.SetSearchOptions(&qwen.SearchOptions{
			ForcedSearch:        true,
			EnableSource:        true,
			EnableCitation:      true,
			PrependSearchResult: true,
		})
	}

	streamCallbackFn := func(ctx context.Context, typ string, chunk []byte) error {
		data := string(chunk)
		if data == "" {
			return nil
		}
		return flushDataThink(data, typ, writer, lang)
	}

	req := &qwen.Request[*qwen.TextContent]{
		Model: p.subType,
		Input: qwen.Input[*qwen.TextContent]{
			Messages: buildMessages(question, history, prompt, knowledgeMessages),
		},
		Parameters:  params,
		StreamingFn: streamCallbackFn,
	}

	resp, err := cli.CreateCompletion(ctx, req)
	if err != nil {
		return nil, err
	}

	if resp.Output.SearchInfo != nil && resp.Output.SearchInfo.SearchResults != nil && len(resp.Output.SearchInfo.SearchResults) > 0 {
		searchResultsJSON, _ := json.Marshal(resp.Output.SearchInfo.SearchResults)
		flushDataThink(string(searchResultsJSON), "search", writer, lang)
	}

	modelResult := &ModelResult{
		PromptTokenCount:   resp.Usage.InputTokens,
		ResponseTokenCount: resp.Usage.OutputTokens,
		TotalTokenCount:    resp.Usage.TotalTokens,
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}

	flusher.Flush()
	return modelResult, nil
}

func buildMessages(question string, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) []qwen.Message[*qwen.TextContent] {
	systemMessages := getSystemMessages(prompt, knowledgeMessages)
	var messages []qwen.Message[*qwen.TextContent]
	for _, systemMsg := range systemMessages {
		content := &qwen.TextContent{Text: systemMsg.Text}
		messages = append(messages, qwen.Message[*qwen.TextContent]{
			Role:    "system",
			Content: content,
		})
	}

	for i := len(history) - 1; i >= 0; i-- {
		historyMessage := history[i]
		content := &qwen.TextContent{Text: historyMessage.Text}
		role := "user"
		if historyMessage.Author == "AI" {
			role = "assistant"
		}
		messages = append(messages, qwen.Message[*qwen.TextContent]{
			Role:    role,
			Content: content,
		})
	}

	questionContent := &qwen.TextContent{Text: question}
	messages = append(messages, qwen.Message[*qwen.TextContent]{
		Role:    "user",
		Content: questionContent,
	})

	return messages
}
