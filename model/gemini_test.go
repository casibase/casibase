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

//go:build !skipCi
// +build !skipCi

package model

import (
	"context"
	"fmt"
	"testing"

	"github.com/beego/beego"
	"github.com/casibase/casibase/proxy"
	"google.golang.org/genai"
)

func TestListGeminiModels(t *testing.T) {
	err := beego.LoadAppConfig("ini", "../conf/app.conf")
	if err != nil {
		panic(err)
	}

	proxy.InitHttpClient()

	apiKey := ""

	ctx := context.Background()

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:     apiKey,
		Backend:    genai.BackendGeminiAPI,
		HTTPClient: proxy.ProxyHttpClient,
	})
	if err != nil {
		panic(err)
	}

	fmt.Println("Available Gemini Models:")
	fmt.Println("========================")

	pageToken := ""
	count := 1
	for {
		listOpts := &genai.ListModelsConfig{
			PageSize:  50,
			PageToken: pageToken,
		}

		resp, err := client.Models.List(ctx, listOpts)
		if err != nil {
			t.Fatalf("Error listing models: %v", err)
		}

		for _, model := range resp.Items {
			fmt.Printf("[%d] %s\n", count, model.Name)
			count++
		}

		if resp.NextPageToken == "" {
			break
		}
		pageToken = resp.NextPageToken
	}
}
