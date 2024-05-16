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

func getMinFromModelUsageMap(modelUsageMap map[string]object.UsageInfo) string {
	min := math.MaxInt
	res := ""
	for provider, usageInfo := range modelUsageMap {
		if min > usageInfo.TokenCount {
			min = usageInfo.TokenCount
			res = provider
		}
	}
	return res
}

func isImageQuestion(question string) bool {
	imgRe := regexp.MustCompile(`<img[^>]+src="([^"]+)"[^>]*>`)
	return imgRe.MatchString(question)
}

func getFilteredModelUsageMap(modelUsageMap map[string]object.UsageInfo, modelProviderMap map[string]*object.Provider) map[string]object.UsageInfo {
	filteredMap := make(map[string]object.UsageInfo)
	for model, provider := range modelProviderMap {
		if provider.SubType == "gpt-4-vision-preview" || provider.SubType == "gpt-4-1106-vision-preview" {
			if usageInfo, exists := modelUsageMap[model]; exists {
				filteredMap[model] = usageInfo
			}
		}
	}
	return filteredMap
}

func GetIdleModelProvider(store *object.Store, name string, question string) (string, model.ModelProvider, error) {
	defaultModelProvider, defaultModelProviderObj, err := object.GetModelProviderFromContext("admin", name)
	if err != nil {
		return "", nil, err
	}

	if len(store.ModelUsageMap) <= 1 {
		return defaultModelProvider.Name, defaultModelProviderObj, nil
	}

	modelProviderMap, modelProviderObjMap, err := object.GetModelProvidersFromContext("admin", name)
	if err != nil {
		return "", nil, err
	}

	modelUsageMap := store.ModelUsageMap

	if isImageQuestion(question) {
		modelUsageMap = getFilteredModelUsageMap(modelUsageMap, modelProviderMap)
	}

	minProvider := getMinFromModelUsageMap(modelUsageMap)
	modelProvider, ok := modelProviderMap[minProvider]
	if !ok {
		return "", nil, fmt.Errorf("No idle model provider found: %s", minProvider)
	}
	modelProviderObj, ok := modelProviderObjMap[minProvider]
	if !ok {
		return "", nil, fmt.Errorf("No idle model provider found: %s", minProvider)
	}

	return modelProvider.Name, modelProviderObj, nil
}
