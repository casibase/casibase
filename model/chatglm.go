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
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/leverly/ChatGLM/client"
)

type ChatGLMModelProvider struct {
	subType      string
	clientSecret string
}

func NewChatGLMModelProvider(subType string, clientSecret string) (*ChatGLMModelProvider, error) {
	return &ChatGLMModelProvider{subType: subType, clientSecret: clientSecret}, nil
}

func (p *ChatGLMModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	proxy := client.NewChatGLMClient(p.clientSecret, 30*time.Second)
	prompt := []client.Message{{Role: "user", Content: question}}
	taskId, err := proxy.AsyncInvoke(p.subType, 0.2, prompt)
	if err != nil {
		return err
	}
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}
	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
		return nil
	}
	response, err := proxy.AsyncInvokeTask(p.subType, taskId)
	if err != nil {
		return err
	}
	content := (*response.Choices)[0].Content
	err = flushData(content)
	if err != nil {
		return err
	}
	return nil
}
