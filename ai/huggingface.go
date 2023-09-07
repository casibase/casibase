package ai

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/casbin/casibase/proxy"
	"github.com/henomis/lingoose/llm/huggingface"
)

type HuggingFaceModelProvider struct {
	SecretKey string
}

func NewHuggingFaceModelProvider(secretKey string) (*HuggingFaceModelProvider, error) {
	p := &HuggingFaceModelProvider{
		SecretKey: secretKey,
	}
	return p, nil
}

func (p *HuggingFaceModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	resp, err := getHuggingFaceResp(question, p.SecretKey)
	if err != nil {
		return err
	}

	fmt.Println(resp)

	return nil
}

func getHuggingFaceResp(question string, secretKey string) (string, error) {
	client := huggingface.New("gpt2", 1, false).WithToken(secretKey).WithHTTPClient(proxy.ProxyHttpClient).WithMode(huggingface.HuggingFaceModeTextGeneration)

	ctx := context.Background()

	resp, err := client.Completion(ctx, question)
	if err != nil {
		return "", err
	}

	return fixHuggingFaceResp(resp), nil
}

func GetHuggingFaceResp(question string, secretKey string) (string, error) {
	return getHuggingFaceResp(question, secretKey)
}

func fixHuggingFaceResp(resp string) string {
	resp = strings.Split(resp, "\n")[0]
	return resp
}
