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

	"github.com/casibase/casibase/i18n"
)

type iFlytekModelProvider struct {
	subType     string
	secretKey   string
	temperature float32
}

func NewiFlytekModelProvider(subType string, secretKey string, temperature float32) (*iFlytekModelProvider, error) {
	p := &iFlytekModelProvider{
		subType:     subType,
		secretKey:   secretKey,
		temperature: temperature,
	}
	return p, nil
}

func (p *iFlytekModelProvider) GetPricing() string {
	return `URL:
https://xinghuo.xfyun.cn/sparkapi

| Model ID       | Unit Price          | Notes                                                         |
|----------------|---------------------|---------------------------------------------------------------|
| spark-x2       | ¥0.30/10k tokens    | Deep reasoning model, 64K input / 128K output                 |
| spark-x1.5     | ¥0.20/10k tokens    | Deep reasoning model, 64K context                             |
| spark4.0-ultra | ¥0.70/10k tokens    | Flagship non-thinking model, 32K context                      |
| spark-pro      | ¥0.07/10k tokens    | Professional-grade model, 8K context                          |
| spark-pro-128k | ¥0.13/10k tokens    | Pro with 128K context window                                  |
| spark-lite     | FREE                | Lightweight model, free forever, 8K context                   |

Note: Spark Max and Spark Max-32K packages were discontinued in March 2026 and merged into Ultra.
`
}

// getBaseURL returns the API base URL for the given subType.
// X2 and X1.5 deep-reasoning models use different endpoints from the standard models.
func (p *iFlytekModelProvider) getBaseURL() string {
	switch p.subType {
	case "spark-x2":
		return "https://spark-api-open.xf-yun.com/x2"
	case "spark-x1.5":
		return "https://spark-api-open.xf-yun.com/v2"
	default:
		return "https://spark-api-open.xf-yun.com/v1"
	}
}

// getAPIModelName maps the casibase subType to the iFlytek HTTP API model name.
func (p *iFlytekModelProvider) getAPIModelName() string {
	switch p.subType {
	case "spark-x2", "spark-x1.5":
		return "spark-x"
	case "spark4.0-ultra":
		return "4.0Ultra"
	case "spark-max":
		return "generalv3.5"
	case "spark-max-32k":
		return "max-32k"
	case "spark-pro":
		return "generalv3"
	case "spark-pro-128k":
		return "pro-128k"
	case "spark-lite":
		return "lite"
	// Legacy model names kept for backward compatibility
	case "spark-v1.5":
		return "lite"
	case "spark-v2.0":
		return "generalv3"
	default:
		return "generalv3"
	}
}

func (p *iFlytekModelProvider) calculatePrice(modelResult *ModelResult, lang string) error {
	price := 0.0
	tokenCount := modelResult.TotalTokenCount
	modelResult.Currency = "CNY"

	switch p.subType {
	case "spark-x2":
		price = float64(tokenCount) / 10000 * 0.30
	case "spark-x1.5":
		price = float64(tokenCount) / 10000 * 0.20
	case "spark4.0-ultra":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.70
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.67
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.065
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.060
		} else if int64(tokenCount) <= int64(10000000000) {
			price = float64(tokenCount) / 10000 * 0.055
		} else {
			price = float64(tokenCount) / 10000 * 0.050
		}
	case "spark-max":
		// Spark Max was discontinued in March 2026, backend upgraded to Ultra pricing
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.30
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.29
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.027
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.025
		} else if int64(tokenCount) <= int64(10000000000) {
			price = float64(tokenCount) / 10000 * 0.023
		} else {
			price = float64(tokenCount) / 10000 * 0.021
		}
	case "spark-max-32k":
		// Spark Max-32K was discontinued in March 2026, backend upgraded to Ultra pricing
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.32
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.31
		} else if tokenCount <= 500000000 {
			price = float64(tokenCount) / 10000 * 0.029
		} else if tokenCount <= 1000000000 {
			price = float64(tokenCount) / 10000 * 0.027
		} else if int64(tokenCount) <= int64(10000000000) {
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
		} else if int64(tokenCount) <= int64(10000000000) {
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
		} else if int64(tokenCount) <= int64(10000000000) {
			price = float64(tokenCount) / 10000 * 0.0108
		} else {
			price = float64(tokenCount) / 10000 * 0.0100
		}
	case "spark-lite":
		price = 0.0
	// Legacy model names kept for backward compatibility
	case "spark-v1.5":
		price = 0.0
	case "spark-v2.0":
		if tokenCount <= 3000000 {
			price = float64(tokenCount) / 10000 * 0.07
		} else if tokenCount <= 15000000 {
			price = float64(tokenCount) / 10000 * 0.068
		} else {
			price = float64(tokenCount) / 10000 * 0.0065
		}
	default:
		return fmt.Errorf(i18n.Translate(lang, "embedding:calculatePrice() error: unknown model type: %s"), p.subType)
	}

	modelResult.TotalPrice = price
	return nil
}

func (p *iFlytekModelProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo, lang string) (*ModelResult, error) {
	baseURL := p.getBaseURL()
	apiModelName := p.getAPIModelName()
	localProvider, err := NewLocalModelProvider("Custom-think", "custom-model", p.secretKey, p.temperature, 0, 0, 0, baseURL, apiModelName, 0, 0, "CNY")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo, lang)
	if err != nil {
		return nil, err
	}

	err = p.calculatePrice(modelResult, lang)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
