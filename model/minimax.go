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

func (p *MiniMaxModelProvider) GetPricing() string {
	return `URL:
https://api.minimax.chat/document/price

| Billing Item     | Unit Price                    | Billing Description                                                                                            |
|------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------|
| abab6            | 0.1 CNY/1k tokens             | Token count includes input and output                                                                          |
| abab5.5          | 0.015 CNY/1k tokens           |                                                                                                                |
| abab5.5s         | 0.005 CNY/1k tokens           |                                                                                                                |
`
}

func (p *MiniMaxModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	priceTable := map[string]float64{
		"abab6":      0.1,
		"abab5.5":    0.015,
		"abab5-chat": 0.015,
		"abab5.5s":   0.005,
	}

	if pricePerThousandTokens, ok := priceTable[p.subType]; ok {
		price = getPrice(modelResult.TotalTokenCount, pricePerThousandTokens)
	} else {
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	modelResult.Currency = "CNY"
	return nil
}

func (p *MiniMaxModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	ctx := context.Background()
	client, err := minimax.New(
		minimax.WithApiToken(p.apiKey),
		minimax.WithGroupId(p.groupID),
	)
	if err != nil {
		return nil, err
	}

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
	res, err := client.ChatCompletions(ctx, req)
	if err != nil {
		return nil, err
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	flushData := func(data string) error {
		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	err = flushData(res.Choices[0].Text)
	if err != nil {
		return nil, err
	}

	totalTokens := int(res.Usage.TotalTokens)
	modelResult := &ModelResult{ResponseTokenCount: totalTokens}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
