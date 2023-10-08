// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/casibase/casibase/proxy"
	"github.com/henomis/lingoose/llm/huggingface"
)

type HuggingFaceModelProvider struct {
	subType   string
	secretKey string
}

func NewHuggingFaceModelProvider(subType string, secretKey string) (*HuggingFaceModelProvider, error) {
	return &HuggingFaceModelProvider{subType: subType, secretKey: secretKey}, nil
}

func (p *HuggingFaceModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := huggingface.New(p.subType, 1, false).WithToken(p.secretKey).WithHTTPClient(proxy.ProxyHttpClient).WithMode(huggingface.HuggingFaceModeTextGeneration)

	ctx := context.Background()

	resp, err := client.Completion(ctx, question)
	if err != nil {
		return err
	}

	resp = strings.Split(resp, "\n")[0]
	fmt.Println(resp)
	return nil
}
