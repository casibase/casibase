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

type ErnieModelProvider struct {
	apiKey    string
	secretKey string
}

func NewErnieModelProvider(apiKey string, secretKey string) (*ErnieModelProvider, error) {
	return &ErnieModelProvider{apiKey: apiKey, secretKey: secretKey}, nil
}

func (p *ErnieModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
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
				Content: question,
			},
		},
		Stream: true,
	}
	stream, err := client.CreateErnieBotChatCompletionStream(ctx, request)
	if err != nil {
		return err
	}

	defer stream.Close()
	for {
		response, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			return nil
		}

		if err != nil {
			return err
		}

		if _, err = fmt.Fprintf(writer, "event: message\ndata: %s\n\n", response.Result); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(response.Result)
	}
}
