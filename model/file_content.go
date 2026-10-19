// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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
	"net"
	"net/url"
	"path"
	"regexp"
	"strings"
	"sync"

	"github.com/the-open-agent/openagent/txt"
	"golang.org/x/sync/singleflight"
)

var (
	fileURLPattern   = regexp.MustCompile(`https?://[^\s<>"']+`)
	fileContentCache sync.Map
	fileContentGroup singleflight.Group
)

// UntrustedContentFilter, when set, screens text nobody typed into the chat (an
// uploaded document, a tool result) before the model reads it.
var UntrustedContentFilter func(kind string, text string) string

type fileContentProvider struct {
	providerType string
	provider     ModelProvider
}

func (p *fileContentProvider) GetPricing() string {
	return p.provider.GetPricing()
}

func (p *fileContentProvider) ListModels() ([]string, error) {
	return p.provider.ListModels()
}

func (p *fileContentProvider) QueryText(question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, toolSession *ToolSession, lang string) (*ModelResult, error) {
	question, err := replaceFileURLs(question, p.providerType, lang)
	if err != nil {
		return nil, err
	}

	history, err = replaceFileURLsInMessages(history, p.providerType, lang)
	if err != nil {
		return nil, err
	}

	return p.provider.QueryText(question, writer, history, prompt, knowledgeMessages, toolSession, lang)
}

func wrapFileContentProvider(providerType string, provider ModelProvider) ModelProvider {
	return &fileContentProvider{
		providerType: providerType,
		provider:     provider,
	}
}

func replaceFileURLs(text string, providerType string, lang string) (string, error) {
	matches := fileURLPattern.FindAllStringIndex(text, -1)
	var result strings.Builder
	last := 0
	for _, match := range matches {
		result.WriteString(text[last:match[0]])
		rawURL := text[match[0]:match[1]]
		if strings.LastIndex(text[:match[0]], "<") > strings.LastIndex(text[:match[0]], ">") {
			result.WriteString(rawURL)
			last = match[1]
			continue
		}
		parsedURL, ext, ok := parseDocumentURL(rawURL)
		if !ok || !shouldReplaceFileURL(providerType, parsedURL) {
			result.WriteString(rawURL)
			last = match[1]
			continue
		}

		content, err := getFileContent(rawURL, ext, lang)
		if err != nil {
			return "", err
		}
		if UntrustedContentFilter != nil {
			content = UntrustedContentFilter("文档", content)
		}
		fmt.Fprintf(&result, "URL: %s\nContent:\n%s", rawURL, content)
		last = match[1]
	}
	result.WriteString(text[last:])
	return result.String(), nil
}

func replaceFileURLsInMessages(messages []*RawMessage, providerType string, lang string) ([]*RawMessage, error) {
	result := make([]*RawMessage, len(messages))
	for i, message := range messages {
		if message == nil {
			continue
		}

		text, err := replaceFileURLs(message.Text, providerType, lang)
		if err != nil {
			return nil, err
		}
		if text == message.Text {
			result[i] = message
			continue
		}

		clone := *message
		clone.Text = text
		result[i] = &clone
	}
	return result, nil
}

func parseDocumentURL(rawURL string) (*url.URL, string, bool) {
	parsedURL, err := url.Parse(rawURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") || parsedURL.Hostname() == "" {
		return nil, "", false
	}

	ext := strings.ToLower(path.Ext(parsedURL.Path))
	for _, supportedExt := range txt.GetSupportedFileTypes() {
		if ext == supportedExt {
			return parsedURL, ext, true
		}
	}
	return nil, "", false
}

func shouldReplaceFileURL(providerType string, parsedURL *url.URL) bool {
	if providerType != "OpenAI" && providerType != "Azure" {
		return true
	}
	return isLocalURL(parsedURL)
}

func isLocalURL(parsedURL *url.URL) bool {
	hostname := strings.ToLower(parsedURL.Hostname())
	if hostname == "localhost" {
		return true
	}

	ip := net.ParseIP(hostname)
	if ip == nil {
		return false
	}
	return ip.IsLoopback() || ip.IsPrivate()
}

func getFileContent(rawURL string, ext string, lang string) (string, error) {
	if content, ok := fileContentCache.Load(rawURL); ok {
		return content.(string), nil
	}

	value, err, _ := fileContentGroup.Do(rawURL, func() (interface{}, error) {
		if content, ok := fileContentCache.Load(rawURL); ok {
			return content.(string), nil
		}

		// rawURL comes from the chat text, so it must not be able to reach internal services.
		content, err := txt.GetParsedTextFromUntrustedUrl(rawURL, ext, lang)
		if err != nil {
			return "", err
		}
		fileContentCache.Store(rawURL, content)
		return content, nil
	})
	if err != nil {
		return "", err
	}
	return value.(string), nil
}
