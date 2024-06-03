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
	"io"
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

func getFilteredModelUsageMap(modelUsageMap map[string]object.UsageInfo, modelProviderMap map[string]*object.Provider, modelProviderObjMap map[string]model.ModelProvider, question string, writer io.Writer, knowledge []*model.RawMessage, history []*model.RawMessage) (map[string]object.UsageInfo, error) {
	visionModelUsageMap := map[string]object.UsageInfo{}
	if isImageQuestion(question) {
		for providerName, usageInfo := range modelUsageMap {
			providerObj := modelProviderMap[providerName]
			if strings.HasSuffix(providerObj.SubType, "-vision-preview") {
				visionModelUsageMap[providerName] = usageInfo
			}
		}
	} else {
		visionModelUsageMap = modelUsageMap
	}

	filteredModelUsageMap := map[string]object.UsageInfo{}
	for providerName, usageInfo := range visionModelUsageMap {
		providerObj := modelProviderObjMap[providerName]
		dryRunQuestion := "$CasibaseDryRun$" + question
		_, err := providerObj.QueryText(dryRunQuestion, writer, history, "", knowledge)
		if err == nil {
			filteredModelUsageMap[providerName] = usageInfo
		}
	}
	return filteredModelUsageMap, nil
}

func GetIdleModelProvider(store *object.Store, name string, question string, writer io.Writer, knowledge []*model.RawMessage, history []*model.RawMessage) (string, model.ModelProvider, error) {
	if len(store.ModelUsageMap) <= 1 {
		defaultModelProvider, defaultModelProviderObj, err := object.GetModelProviderFromContext("admin", name)
		if err != nil {
			return "", nil, err
		}

		return defaultModelProvider.Name, defaultModelProviderObj, nil
	}

	modelProviderMap, modelProviderObjMap, err := object.GetModelProvidersFromContext("admin", name)
	if err != nil {
		return "", nil, err
	}

	modelUsageMap := store.ModelUsageMap

	modelUsageMap, err = getFilteredModelUsageMap(modelUsageMap, modelProviderMap, modelProviderObjMap, question, writer, knowledge, history)
	if err != nil {
		return "", nil, err
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
