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

func (p *iFlytekModelProvider) QueryText(question string, writer io.Writer, builder *strings.Builder) error {
	client := iflytek.NewServer(p.appID, p.apiKey, p.secretKey)
	flusher, ok := writer.(http.Flusher)
	if !ok {
		return fmt.Errorf("writer does not implement http.Flusher")
	}

	session, err := client.GetSession("1")
	if err != nil {
		return fmt.Errorf("iflytek get session error: %v", err)
	}
	if session == nil {
		return fmt.Errorf("iflytek get session error: session is nil")
	}

	session.Req.Parameter.Chat.Temperature = p.temperature
	session.Req.Parameter.Chat.TopK = p.topK

	response, err := session.Send(question)
	if err != nil {
		return fmt.Errorf("iflytek send error: %v", err)
	}

	flushData := func(data string) error {
		if _, err := fmt.Fprintf(writer, "event: message\ndata: %s\n\n", data); err != nil {
			return err
		}
		flusher.Flush()
		builder.WriteString(data)
		return nil
	}

	err = flushData(response)
	if err != nil {
		return err
	}

	return nil
}
