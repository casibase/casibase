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
	"errors"
	"fmt"
	"math"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/txt"
)

var reImage *regexp.Regexp

func init() {
	reImage, _ = regexp.Compile(`<img[^>]+src="([^"]+)"[^>]*>`)
}

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
	res := reImage.MatchString(question)
	return res
}

func getFilteredModelUsageMap(modelUsageMap map[string]object.UsageInfo, modelProviderMap map[string]*object.Provider) map[string]object.UsageInfo {
	res := map[string]object.UsageInfo{}
	for providerName, usageInfo := range modelUsageMap {
		providerObj := modelProviderMap[providerName]
		if strings.HasSuffix(providerObj.SubType, "-vision-preview") {
			res[providerName] = usageInfo
		}
	}
	return res
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

func GetModelProviderByOutputType(store *object.Store, outputType string, question string) (string, model.ModelProvider, error) {
	primary := store.ModelProvider
	providers := store.ModelProviders

	newProviders := []string{primary}

	for _, provider := range providers {
		if provider != primary {
			newProviders = append(newProviders, provider)
		}
	}

	providers = newProviders

	imageProviders := []string{
		"dall-e-3",
		"dall-e-2",
	}

	elementInArray := func(val string, arr []string) bool {
		for _, item := range arr {
			if item == val {
				return true
			}
		}
		return false
	}

	for _, providerName := range providers {
		modelProvider, modelProviderObj, err := object.GetModelProviderFromContext("admin", providerName)
		if err != nil {
			return "", nil, err
		}
		if ((outputType == "image") == elementInArray(modelProvider.SubType, imageProviders)) ||
			(isImageQuestion(question) && strings.HasSuffix(modelProvider.SubType, "-vision-preview")) {
			return modelProvider.Name, modelProviderObj, nil
		}
	}
	return "", nil, errors.New("For image-related issues, a model that supports image output needs to be added, such as DALL-E 3")
}
