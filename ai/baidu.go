package ai

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	ernie "github.com/anhao/go-ernie"
)

type BaiduModelProvider struct {
	apiKey    string
	secretKey string
}

func NewBaiduModelProvider(apiKey string, secretKey string) (*BaiduModelProvider, error) {
	return &BaiduModelProvider{apiKey: apiKey, secretKey: secretKey}, nil
}

func (p *BaiduModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := ernie.NewDefaultClient(p.apiKey, p.secretKey)
	ctx := context.Background()
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}

	request := ernie.ErnieBotRequest{
		Messages: []ernie.ChatCompletionMessage{
			{
				Role:    "user",
				Content: "Hello",
			},
		},
		Stream: true,
	}
	stream, err := client.CreateErnieBotChatCompletionStream(ctx, request)
	if err != nil {
		fmt.Printf("ernie bot stream error: %v\n", err)
		return err
	}

	defer stream.Close()
	for {
		response, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			fmt.Println("ernie bot Stream finished")
			return nil
		}

		if err != nil {
			fmt.Printf("ernie bot stream error: %v\n", err)
			return err
		}

		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", response.Result); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(response.Result)
	}
}
