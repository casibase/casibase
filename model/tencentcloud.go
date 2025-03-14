// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"io"
	"strings"
)

type TencentCloudClient struct {
	endpoint    string
	subType     string
	apiKey      string
	temperature float32
	topP        float32
}

func NewTencentCloudProvider(secretKey, endpoint, subType string, temperature, topP float32) (*TencentCloudClient, error) {
	if endpoint == "" {
		endpoint = "https://api.hunyuan.cloud.tencent.com/v1"
	}
	return &TencentCloudClient{
		apiKey:      secretKey,
		endpoint:    endpoint,
		subType:     subType,
		temperature: temperature,
		topP:        topP,
	}, nil
}

func (c *TencentCloudClient) GetPricing() string {
	return `Pricing information for Tencent Cloud models is not yet available.`
}

func (c *TencentCloudClient) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage) (*ModelResult, error) {
	baseUrl := c.endpoint
	// Get model name
	model := ""
	if strings.Contains(strings.ToLower(c.subType), "hunyuan") {
		model = c.subType
	} else {
		modelSplit := strings.Split(c.endpoint, "/")
		model = modelSplit[len(modelSplit)-1]
	}
	// Create a new LocalModelProvider to handle the request
	localProvider, err := NewLocalModelProvider("Custom", "custom-model", c.apiKey, c.temperature, c.topP, 0, 0, baseUrl, model, 0, 0, "CNY")
	if err != nil {
		return nil, err
	}

	modelResult, err := localProvider.QueryText(question, writer, history, prompt, knowledgeMessages)
	if err != nil {
		return nil, err
	}
	return modelResult, nil
}
