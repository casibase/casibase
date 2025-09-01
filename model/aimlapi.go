// Copyright 2023 The Casibase Authors.
// Licensed under the Apache License, Version 2.0.

package model

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	aimlapi "github.com/D1m7asis/casibase-aimlapi-go"
	"github.com/casibase/casibase/proxy"
)

//// ---- Raw HTTP dump transport: logs full request/response to stderr ----

type dumpTransport struct {
	base http.RoundTripper
}

func (t *dumpTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	var reqBuf bytes.Buffer
	fmt.Fprintf(&reqBuf, "==== AIMLAPI REQUEST ====\n%s %s\n", req.Method, req.URL.String())
	for k, v := range req.Header {
		fmt.Fprintf(&reqBuf, "%s: %s\n", k, strings.Join(v, ", "))
	}
	if req.Body != nil {
		bodyCopy, _ := io.ReadAll(req.Body)
		_ = req.Body.Close()
		req.Body = io.NopCloser(bytes.NewReader(bodyCopy))
		if len(bodyCopy) > 0 {
			fmt.Fprintf(&reqBuf, "\n%s\n", string(bodyCopy))
		}
	}
	fmt.Fprintln(&reqBuf, "=========================")
	fmt.Fprint(os.Stderr, reqBuf.String())

	rt := t.base
	if rt == nil {
		rt = http.DefaultTransport
	}
	resp, err := rt.RoundTrip(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "==== AIMLAPI TRANSPORT ERROR ====\n%v\n===============================\n", err)
		return nil, err
	}

	var respBuf bytes.Buffer
	fmt.Fprintf(&respBuf, "==== AIMLAPI RESPONSE ====\nHTTP %d %s\n", resp.StatusCode, http.StatusText(resp.StatusCode))
	for k, v := range resp.Header {
		fmt.Fprintf(&respBuf, "%s: %s\n", k, strings.Join(v, ", "))
	}
	if resp.Body != nil {
		bodyCopy, _ := io.ReadAll(resp.Body)
		_ = resp.Body.Close()
		resp.Body = io.NopCloser(bytes.NewReader(bodyCopy))
		if len(bodyCopy) > 0 {
			fmt.Fprintf(&respBuf, "\n%s\n", string(bodyCopy))
		}
	}
	fmt.Fprintln(&respBuf, "=========================")
	fmt.Fprint(os.Stderr, respBuf.String())

	return resp, nil
}

//// ----------------------------------------------------------------------

// AIMLAPIModelProvider implements Casibase provider for AI/ML API.
type AIMLAPIModelProvider struct {
	subType     string
	secretKey   string
	siteName    string
	siteUrl     string
	temperature *float32
	topP        *float32
}

func NewAIMLAPIModelProvider(subType string, secretKey string, temperature float32, topP float32) (*AIMLAPIModelProvider, error) {
	return &AIMLAPIModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		siteName:    "Casibase",
		siteUrl:     "https://casibase.org",
		temperature: &temperature,
		topP:        &topP,
	}, nil
}

func (p *AIMLAPIModelProvider) GetPricing() string {
	return `URL:
https://aimlapi.com/pricing

Notes:
- Pricing varies per model (OpenAI, Anthropic, Google, Meta, etc.)
- Always use the official page as the source of truth
`
}

// calculatePrice assigns token usage cost if known; otherwise defaults to 0 USD.
func (p *AIMLAPIModelProvider) calculatePrice(modelResult *ModelResult) error {
	var inPerK, outPerK float64

	// Minimal example price table (extend/replace per your policy).
	priceTable := map[string][]float64{
		// OpenAI
		"openai/gpt-4o":     {0.005, 0.015},
		"gpt-4o-2024-05-13": {0.005, 0.015},
		"gpt-4o-mini":       {0.003, 0.006},
		"gpt-3.5-turbo":     {0.001, 0.002},

		// Anthropic
		"claude-3-5-sonnet-20240620": {0.003, 0.015},
		"claude-3-haiku-20240307":    {0.0008, 0.0024},

		// Google
		"google/gemini-2.5-pro": {0.0025, 0.0075},
		"google/gemma-3-4b-it":  {0.0004, 0.0008},

		// Meta
		"meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": {0.0002, 0.0006},
		"meta-llama/Llama-3-8b-chat-hf":               {0.0002, 0.0006},

		// DeepSeek
		"deepseek-chat":     {0.0006, 0.0012},
		"deepseek-reasoner": {0.0015, 0.0030},
	}

	if pvals, ok := priceTable[p.subType]; ok {
		inPerK, outPerK = pvals[0], pvals[1]
	} else {
		inPerK, outPerK = 0, 0
	}

	inPrice := getPrice(modelResult.PromptTokenCount, inPerK)
	outPrice := getPrice(modelResult.ResponseTokenCount, outPerK)
	modelResult.TotalPrice = AddPrices(inPrice, outPrice)
	modelResult.Currency = "USD"
	return nil
}

// choose HTTP client: proxy in PROD, verbose dump in DEBUG.
func (p *AIMLAPIModelProvider) getClient() *aimlapi.Client {
	cfg, err := aimlapi.DefaultConfig(p.secretKey, p.siteName, p.siteUrl)
	if err != nil {
		panic(err)
	}

	if os.Getenv("AIMLAPI_DEBUG_HTTP") == "1" {
		cfg.HTTPClient = &http.Client{
			Timeout:   90 * time.Second,
			Transport: &dumpTransport{base: http.DefaultTransport},
		}
	} else {
		cfg.HTTPClient = proxy.ProxyHttpClient
	}

	return aimlapi.NewClientWithConfig(cfg)
}

// clampMaxTokens keeps maxTokens within a conservative safe range.
func clampMaxTokens(want int) (int, bool) {
	if want <= 0 {
		return 0, false // omit field
	}
	if want > 4000 {
		return 4000, true
	}
	return want, true
}

// tiny retry helper on 429/5xx
func createWithRetry(ctx context.Context, c *aimlapi.Client, req *aimlapi.ChatCompletionRequest) (*aimlapi.ChatCompletionResponse, error) {
	const max = 3
	var last error
	for i := 0; i < max; i++ {
		r, err := c.CreateChatCompletion(ctx, req)
		if err == nil {
			return r, nil
		}
		last = err
		var st interface{ StatusCode() int }
		if errors.As(err, &st) {
			code := st.StatusCode()
			if code != 429 && code < 500 {
				break
			}
		}
		time.Sleep(time.Duration(300*(i+1)) * time.Millisecond)
	}
	return nil, last
}

func (p *AIMLAPIModelProvider) QueryText(
	question string,
	writer io.Writer,
	history []*RawMessage,
	prompt string,
	knowledgeMessages []*RawMessage,
	agentInfo *AgentInfo,
) (*ModelResult, error) {
	client := p.getClient()

	// per-request timeout
	base := context.Background()
	ctx, cancel := context.WithTimeout(base, 60*time.Second)
	defer cancel()

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}

	// Effective model
	model := p.subType
	if model == "" {
		// Choose a widely available default to reduce 400 due to model access
		model = "gpt-3.5-turbo"
	}

	// Token + context checks based on the effective model.
	tokenCount, err := GetTokenSize(model, question)
	if err != nil {
		return nil, err
	}
	contextLength := getContextLength(model)

	// Dry-run path for quick token-fit checks.
	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		mr, err := getDefaultModelResult(model, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if contextLength > mr.TotalTokenCount {
			return mr, nil
		}
		return nil, fmt.Errorf("exceeds max tokens")
	}

	wantMax := contextLength - tokenCount
	maxTokens, useMax := clampMaxTokens(wantMax)

	temperature := p.temperature
	topP := p.topP

	// Build request; set MaxTokens only when valid to avoid 400s.
	req := &aimlapi.ChatCompletionRequest{
		Model: model,
		Messages: []aimlapi.ChatCompletionMessage{
			{Role: aimlapi.ChatMessageRoleSystem, Content: "You are a helpful assistant."},
			{Role: aimlapi.ChatMessageRoleUser, Content: question},
		},
		Stream:      false,
		Temperature: temperature,
		TopP:        topP,
	}
	if useMax {
		req.MaxTokens = maxTokens
	}

	// call with small retry
	resp, err := createWithRetry(ctx, client, req)
	if err != nil {
		// Avoid %!s(<nil>) — always print %v; add status if available
		var withStatus interface{ StatusCode() int }
		if errors.As(err, &withStatus) {
			return nil, fmt.Errorf("AIMLAPI error (status=%d): %v", withStatus.StatusCode(), err)
		}
		return nil, fmt.Errorf("AIMLAPI error: %v", err)
	}

	var data string
	if resp != nil && len(resp.Choices) > 0 {
		data = resp.Choices[0].Message.Content
	}

	// Forward the final message once via SSE for the frontend.
	if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
		return nil, err
	}
	flusher.Flush()

	// Build result and best‑effort usage (local token counting; SDK has no Usage).
	mr, err := getDefaultModelResult(model, question, data)
	if err != nil {
		return nil, err
	}

	// Recompute tokens locally (prompt + response).
	if pt, err := GetTokenSize(model, question); err == nil {
		mr.PromptTokenCount = pt
	}
	if rt, err := GetTokenSize(model, data); err == nil {
		mr.ResponseTokenCount = rt
	}
	mr.TotalTokenCount = mr.PromptTokenCount + mr.ResponseTokenCount

	if err := p.calculatePrice(mr); err != nil {
		return nil, err
	}
	return mr, nil
}
