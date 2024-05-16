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

package controllers

import (
	"encoding/json"
	"fmt"
	"math"
	"path/filepath"
	"regexp"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/txt"
)

func (c *ApiController) ResponseErrorStream(message *object.Message, errorText string) {
	if !message.IsAlerted {
		err := message.SendErrorEmail()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	if message.ErrorText != errorText || !message.IsAlerted {
		message.ErrorText = errorText
		message.IsAlerted = true
		_, err := object.UpdateMessage(message.GetId(), message)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	event := fmt.Sprintf("event: myerror\ndata: %s\n\n", errorText)
	_, err := c.Ctx.ResponseWriter.Write([]byte(event))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
}

func refineQuestionTextViaParsingUrlContent(question string) (string, error) {
	re := regexp.MustCompile(`href="([^"]+)"`)
	urls := re.FindStringSubmatch(question)
	if len(urls) == 0 {
		return question, nil
	}

	href := urls[1]
	ext := filepath.Ext(href)
	content, err := txt.GetParsedTextFromUrl(href, ext)
	if err != nil {
		return "", err
	}

	aTag := regexp.MustCompile(`<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?</a>`)
	res := aTag.ReplaceAllString(question, content)
	return res, nil
}

func ConvertMessageDataToJSON(data string) ([]byte, error) {
	jsonData := map[string]string{"text": data}
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, err
	}
	return jsonBytes, nil
}

func GetIdleModelProvider(store *object.Store, name string) (string, model.ModelProvider, error) {
	defaultModelProvider, defaultModelProviderObj, err := object.GetModelProviderFromContext("admin", name)
	if err != nil {
		return "", nil, err
	}

	modelProviders, modelProviderObjs, err := object.GetModelProvidersFromContext("admin", name)
	if err != nil {
		return "", nil, err
	}

	if len(store.ModelUsageMap) <= 1 {
		return defaultModelProvider.Name, defaultModelProviderObj, nil
	}

	minTokenCount := math.MaxInt
	var minProvider string
	for provider, usageInfo := range store.ModelUsageMap {
		if usageInfo.TokenCount < minTokenCount {
			minTokenCount = usageInfo.TokenCount
			minProvider = provider
		}
	}

	for i, modelProvider := range modelProviders {
		if modelProvider.Name == minProvider {
			return modelProvider.Name, modelProviderObjs[i], nil
		}
	}
	return "", nil, fmt.Errorf("No idle model provider found")
}
