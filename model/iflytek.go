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
| 2 million tokens   | 2   | 1 year   | Spark4.0 Ultra   |     FREE         | ¥ 0            |
| 5 million tokens   | 2   | 1 year   | Spark4.0 Ultra   |     FREE         | ¥ 0            |
| 3 million tokens   | 3   | 1 year   | Spark4.0 Ultra   | ¥0.70/10k tokens | ¥ 210          |
|15 million tokens   | 3   | 1 year   | Spark4.0 Ultra   | ¥0.67/10k tokens | ¥ 1000         |
|500 million tokens  | 5   | 1 year   | Spark4.0 Ultra   | ¥0.065/10k tokens| ¥ 3250         |
|1000 million tokens | 10  | 1 year   | Spark4.0 Ultra   | ¥0.060/10k tokens| ¥ 6000         |
|10000 million tokens| 20  | 1 year   | Spark4.0 Ultra   | ¥0.055/10k tokens| ¥ 55000        |
|50000 million tokens| 50  | 1 year   | Spark4.0 Ultra   | ¥0.050/10k tokens| ¥ 250000       |
| 5 million tokens   | 2   | 1 year   | Spark Max        |     FREE         | ¥ 0            |
|500 million tokens  | 2   | 1 year   | Spark Max        |     FREE         | ¥ 0            |
| 3 million tokens   | 3   | 1 year   | Spark Max        | ¥0.30/10k tokens | ¥ 90           |
|15 million tokens   | 3   | 1 year   | Spark Max        | ¥0.29/10k tokens | ¥ 435          |
|500 million tokens  | 5   | 1 year   | Spark Max        | ¥0.027/10k tokens| ¥ 1350         |
|1000 million tokens | 10  | 1 year   | Spark Max        | ¥0.025/10k tokens| ¥ 2500         |
|10000 million tokens| 20  | 1 year   | Spark Max        | ¥0.023/10k tokens| ¥ 23000        |
|50000 million tokens| 50  | 1 year   | Spark Max        | ¥0.021/10k tokens| ¥ 105000       |
| 2 million tokens   | 2   | 1 year   | Spark Max-32K    |     FREE         | ¥ 0            |
| 5 million tokens   | 2   | 1 year   | Spark Max-32K    |     FREE         | ¥ 0            |
| 3 million tokens   | 3   | 1 year   | Spark Max-32K    | ¥0.32/10k tokens | ¥ 96           |
|15 million tokens   | 3   | 1 year   | Spark Max-32K    | ¥0.31/10k tokens | ¥ 465          |
|500 million tokens  | 5   | 1 year   | Spark Max-32K    | ¥0.029/10k tokens| ¥ 1450         |
|1000 million tokens | 10  | 1 year   | Spark Max-32K    | ¥0.027/10k tokens| ¥ 2700         |
|10000 million tokens| 20  | 1 year   | Spark Max-32K    | ¥0.025/10k tokens| ¥ 25000        |
|50000 million tokens| 50  | 1 year   | Spark Max-32K    | ¥0.023/10k tokens| ¥ 115000       |
| 5 million tokens   | 2   | 1 year   | Spark Pro        |     FREE         | ¥ 0            |
|500 million tokens  | 2   | 1 year   | Spark Pro        |     FREE         | ¥ 0            |
| 3 million tokens   | 3   | 1 year   | Spark Pro        |¥0.07/10k  tokens | ¥ 21           |
|15 million tokens   | 3   | 1 year   | Spark Pro        |¥0.068/10k tokens | ¥ 102          |
|500 million tokens  | 5   | 1 year   | Spark Pro        |¥0.0065/10k tokens| ¥ 325          |
|1000 million tokens | 10  | 1 year   | Spark Pro        |¥0.0060/10k tokens| ¥ 600          |
|10000 million tokens| 20  | 1 year   | Spark Pro        |¥0.0055/10k tokens| ¥ 5500         |
|50000 million tokens| 50  | 1 year   | Spark Pro        |¥0.0050/10k tokens| ¥ 25000        |
| 2 million tokens   | 2   | 1 year   | Spark Pro-128K   |     FREE         | ¥ 0            |
| 5 million tokens   | 2   | 1 year   | Spark Pro-128K   |     FREE         | ¥ 0            |
| 3 million tokens   | 3   | 1 year   | Spark Pro-128K   |¥0.13/10k  tokens | ¥ 39           |
|15 million tokens   | 3   | 1 year   | Spark Pro-128K   |¥0.127/10k tokens | ¥ 190          |
|500 million tokens  | 5   | 1 year   | Spark Pro-128K   |¥0.012/10k tokens | ¥ 600          |
|1000 million tokens | 10  | 1 year   | Spark Pro-128K   |¥0.0115/10k tokens| ¥ 1150         |
|10000 million tokens| 20  | 1 year   | Spark Pro-128K   |¥0.0108/10k tokens| ¥ 10800        |
|50000 million tokens| 50  | 1 year   | Spark Pro-128K   |¥0.0100/10k tokens| ¥ 50000        |
|     Unlimited      | 2   |Unlimited | Spark Lite       |     FREE         | ¥ 0            |

`
}

func (p *iFlytekModelProvider) calculatePrice(modelResult *ModelResult) error {
	price := 0.0
	tokenCount := modelResult.TotalTokenCount
	modelResult.Currency = "CNY"

	switch p.subType {
	case "spark-ultra":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.70
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.67
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.065
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.060
		} else if tokenCount <= 10000000000 {
			price = float64(tokenCount) / 10000 * 0.055
		} else {
			price = float64(tokenCount) / 10000 * 0.050
		}
	case "spark-max":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.30
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.29
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.027
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.025
		} else if tokenCount <= 10000000000 {
			price = float64(tokenCount) / 10000 * 0.023
		} else {
			price = float64(tokenCount) / 10000 * 0.021
		}
	case "spark-max-32k":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.32
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.31
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.029
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.027
		} else if tokenCount <= 10000000000 {
			price = float64(tokenCount) / 10000 * 0.025
		} else {
			price = float64(tokenCount) / 10000 * 0.023
		}
	case "spark-pro":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.07
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.068
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.0065
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.0060
		} else if tokenCount <= 10000000000 {
			price = float64(tokenCount) / 10000 * 0.0055
		} else {
			price = float64(tokenCount) / 10000 * 0.0050
		}
	case "spark-pro-128k":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.13
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.127
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.012
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.0115
		} else if tokenCount <= 10000000000 {
			price = float64(tokenCount) / 10000 * 0.0108
		} else {
			price = float64(tokenCount) / 10000 * 0.0100
		}
	case "spark-lite":
		price = 0.0
	default:
		return fmt.Errorf("calculatePrice() error: unknown model type: %s", p.subType)
	}

	modelResult.TotalPrice = price
	return nil
}

func (p *iFlytekModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
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
		if getContextLength(p.subType) > modelResult.TotalTokenCount {
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
