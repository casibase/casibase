package model

import (
	"context"
	"fmt"
	textv1 "github.com/ConnectAI-E/go-minimax/gen/go/minimax/text/v1"
	"github.com/ConnectAI-E/go-minimax/minimax"
	"io"
	"net/http"
	"strings"
)

type MiniMaxModelProvider struct {
	subType string
	groupID string
	apiKey  string
}

func NewMiniMaxModelProvider(subType string, groupID string, apiKey string) (*MiniMaxModelProvider, error) {
	return &MiniMaxModelProvider{subType: subType, groupID: groupID, apiKey: apiKey}, nil
}

func (p *MiniMaxModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
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
		Temperature: 0.7,
	}
	res, _ := client.ChatCompletions(ctx, req)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
		return nil
	}
	err := flushData(res.Choices[0].Text)
	if err != nil {
		return err
	}
	return nil
}
