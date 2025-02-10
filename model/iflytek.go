// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"fmt"
	"io"
	"net/http"
	"strings"

	iflytek "github.com/vogo/xfspark/chat"
)

type iFlytekModelProvider struct {
	subType     string
	appID       string
	apiKey      string
	secretKey   string
	temperature string
	topK        int
}

func NewiFlytekModelProvider(subType string, secretKey string, temperature float32, topK int) (*iFlytekModelProvider, error) {
	p := &iFlytekModelProvider{
		subType:     subType,
		appID:       "",
		apiKey:      "",
		secretKey:   secretKey,
		temperature: fmt.Sprintf("%f", temperature),
		topK:        topK,
	}
	return p, nil
}

func (p *iFlytekModelProvider) GetPricing() string {
	return `URL:
https://xinghuo.xfyun.cn/sparkapi

| Service Volume     | QPS | Validity | Version          | Unit Price       | Original Price |
|--------------------|-----|----------|------------------|------------------|----------------|
| 2 million tokens   | 2   | 1 year   | Spark Model V1.5 | Free             | ¥0             |
| 5 million tokens   | 2   | 1 year   | Spark Model V1.5 | Free             | ¥0             |
| 2 million tokens   | 2   | 1 year   | Spark Model V3.0 | Free             | ¥0             |
| 5 million tokens   | 2   | 1 year   | Spark Model V3.0 | Free             | ¥0             |
| 2 million tokens   | 2   | 1 year   | Spark Model V3.5 | Free             | ¥0             |
| 5 million tokens   | 2   | 1 year   | Spark Model V3.5 | Free             | ¥0             |
| 50 million tokens  | 2   | 1 year   | Spark Model V1.5 | ¥0.15/10k tokens | ¥750           |
| 50 million tokens  | 2   | 1 year   | Spark Model V3.0 | ¥0.30/10k tokens | ¥1500          |
| 50 million tokens  | 2   | 1 year   | Spark Model V3.5 | ¥0.30/10k tokens | ¥1500          |
| 100 million tokens | 2   | 1 year   | Spark Model V1.5 | ¥0.14/10k tokens | ¥1400          |
| 100 million tokens | 2   | 1 year   | Spark Model V3.0 | ¥0.28/10k tokens | ¥2800          |
| 100 million tokens | 2   | 1 year   | Spark Model V3.5 | ¥0.28/10k tokens | ¥2800          |
| 1 billion tokens   | 20  | 1 year   | Spark Model V1.5 | ¥0.13/10k tokens | ¥13000         |
| 1 billion tokens   | 20  | 1 year   | Spark Model V3.0 | ¥0.26/10k tokens | ¥26000         |
| 1 billion tokens   | 20  | 1 year   | Spark Model V3.5 | ¥0.26/10k tokens | ¥26000         |
| 5 billion tokens   | 50  | 1 year   | Spark Model V1.5 | ¥0.12/10k tokens | ¥60000         |
| 5 billion tokens   | 50  | 1 year   | Spark Model V3.0 | ¥0.24/10k tokens | ¥120000        |
| 5 billion tokens   | 50  | 1 year   | Spark Model V3.5 | ¥0.24/10k tokens | ¥120000        |
`
}

func (p *iFlytekModelProvider) calculatePrice(modelResult *ModelResult) error {
	// Because it is a one-time purchase, it is inconvenient to charge
	price := 0.0
	switch p.subType {
	case "spark-v1.5":
		price = getPrice(modelResult.TotalTokenCount, 0.015)
	case "spark-v3.0":
		price = getPrice(modelResult.TotalTokenCount, 0.030)
	case "spark-v3.5":
		price = getPrice(modelResult.TotalTokenCount, 0.030)
	default:
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}
	modelResult.Currency = "CNY"
	modelResult.TotalPrice = price
	return nil
}

func (p *iFlytekModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	client := iflytek.NewServer(p.appID, p.apiKey, p.secretKey)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("writer does not implement http.Flusher")
	}
	if strings.HasPrefix(question, "$CasibaseDryRun$") {
		modelResult, err := getDefaultModelResult(p.subType, question, "")
		if err != nil {
			return nil, fmt.Errorf("cannot calculate tokens")
		}
		if 32000 > modelResult.TotalTokenCount {
			return modelResult, nil
		} else {
			return nil, fmt.Errorf("exceed max tokens")
		}
	}

	session, err := client.GetSession("1")
	if err != nil {
		return nil, fmt.Errorf("iflytek get session error: %v", err)
	}
	if session == nil {
		return nil, fmt.Errorf("iflytek get session error: session is nil")
	}

	session.Req.Parameter.Chat.Temperature = p.temperature
	session.Req.Parameter.Chat.TopK = p.topK
	response, err := session.Send(question)
	if err != nil {
		return nil, fmt.Errorf("iflytek send error: %v", err)
	}

	flushData := func(data string) error {
		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	err = flushData(response)
	if err != nil {
		return nil, err
	}

	modelResult, err := getDefaultModelResult(p.subType, question, response)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult)
	if err != nil {
		return nil, err
	}

	return modelResult, nil
}
