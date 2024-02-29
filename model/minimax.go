package model

import (
	"context"
	"fmt"
	"io"
	"net/http"

	textv1 "github.com/ConnectAI-E/go-minimax/gen/go/minimax/text/v1"
	"github.com/ConnectAI-E/go-minimax/minimax"
)

type MiniMaxModelProvider struct {
	subType     string
	groupID     string
	apiKey      string
	temperature float32
}

func NewMiniMaxModelProvider(subType string, groupID string, apiKey string, temperature float32) (*MiniMaxModelProvider, error) {
	return &MiniMaxModelProvider{
		subType:     subType,
		groupID:     groupID,
		apiKey:      apiKey,
		temperature: temperature,
	}, nil
}

func (p *MiniMaxModelProvider) GetPricing() (string, string) {
	return "CNY", `URL:
https://api.minimax.chat/document/price

| Billing Item     | Unit Price                    | Billing Description                                                                                            |
|------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------|
| abab6            | 0.1 CNY/1k tokens             | Token count includes input and output                                                                          |
| abab5.5          | 0.015 CNY/1k tokens           |                                                                                                                |
| abab5.5s         | 0.005 CNY/1k tokens           |                                                                                                                |
| Web Search Count | 0.03 CNY/each web search call | After enabling the plugin_web_search plugin, the interface automatically counts the number of web search calls |
`
}

func (p *MiniMaxModelProvider) caculatePrice(mr *ModelResult) {
	priceTable := map[string][]float64{
		"abab6":      {0.1, 0.1},
		"abab5.5":    {0.015, 0.015},
		"abab5-chat": {0.015, 0.015},
		"abab5.5s":   {0.005, 0.005},
	}
	if mr.ResponseTokenCount < 1000 {
		mr.TotalPrice = priceTable[p.subType][0] * float64(mr.TotalTokenCount)
	} else {
		mr.TotalPrice = 0.0
	}
}

func (p *MiniMaxModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	client, _ := minimax.New(
		minimax.WithApiToken(p.apiKey),
		minimax.WithGroupId(p.groupID),
	)
	req := &textv1.ChatCompletionsRequest{
		Messages: []*textv1.Message{
			{
				SenderType: "USER",
				Text:       question,
			},
		},
		Model:       p.subType,
		Temperature: p.temperature,
	}
	res, _ := client.ChatCompletions(ctx, req)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}
	err := flushData(res.Choices[0].Text)
	if err != nil {
		return nil, err
	}

	mr := new(ModelResult)
	mr.PromptTokenCount = int(res.Usage.TotalTokens)
	p.caculatePrice(mr)

	return mr, nil
}
