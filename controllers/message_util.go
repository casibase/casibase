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
	if message != nil {
		if !message.IsAlerted {
			err := message.SendErrorEmail(errorText)
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

func getModelResponseType(modelName string) (bool, error) {
	// this function returns the model response type, which is either "image" or "text"
	// return True if the model response type is "image", otherwise return False

	// TODO: Seperate the model response type by text and image
	// The current implementation just check if a model is image model or not
	// May need change in the

	ImageResponseModelList := []string{
		"dall-e-3",
	}

	for _, model := range ImageResponseModelList {
		if model == modelName {
			return true, nil
		}
	}
	return false, nil
}

func getPromptIntentionHelper(textModelUsageMap map[string]object.UsageInfo, modelProviderObjMap map[string]model.ModelProvider, question string) (string, error) {
	// Pick the text model provider to identify the prompt intention
	// Different strategies can be used to pick the text model provider
	// Here we use the model with the minimum token count
	getIntentionModelName := getMinFromModelUsageMap(textModelUsageMap)
	getIntentionModelObj := modelProviderObjMap[getIntentionModelName]

	// Get the prompt intention, result is either "image" or "text"
	history := []*model.RawMessage{}
	knowledge := []*model.RawMessage{}
	var tmpWriter object.MyWriter
	getIntentionPrompt := "Is the following user prompt asking for an image or a text response? Your answer should only be 'image' or 'text' Just use one word, do not add other words: [" + question + "]"

	_, err := getIntentionModelObj.QueryText(getIntentionPrompt, &tmpWriter, history, "", knowledge)
	if err != nil {
		return "", err
	}

	res := tmpWriter.String()
	respType := strings.Trim(res, "\"")
	return respType, nil
}

type modelUsageMapByResponseType struct {
	visionModelUsageMap map[string]object.UsageInfo
	imageModelUsageMap  map[string]object.UsageInfo
	textModelUsageMap   map[string]object.UsageInfo
}


func (m *modelUsageMapByResponseType) filterModelUsageMapByIntention(question string, intention string) map[string]object.UsageInfo {
	var tmpModelUsageMap map[string]object.UsageInfo
	if isImageQuestion(question) {
		tmpModelUsageMap = m.visionModelUsageMap
	} else {
		if intention == "image" {
			tmpModelUsageMap = m.imageModelUsageMap
		} else {
			tmpModelUsageMap = m.textModelUsageMap
		}
	}
	return tmpModelUsageMap
}

func classifyModelUsageMapByResponseType(modelUsageMap map[string]object.UsageInfo, modelProviderMap map[string]*object.Provider, question string) (*modelUsageMapByResponseType, error) {
	modelUsageMapByResp := &modelUsageMapByResponseType{ 
		visionModelUsageMap: map[string]object.UsageInfo{}, 
		imageModelUsageMap: map[string]object.UsageInfo{}, 
		textModelUsageMap: map[string]object.UsageInfo{},
	}
	// Filter the model usage map based on the model response type
	for providerName, usageInfo := range modelUsageMap {
		providerObj := modelProviderMap[providerName]
		if strings.HasSuffix(providerObj.SubType, "-vision-preview") {
			modelUsageMapByResp.visionModelUsageMap[providerName] = usageInfo
		} else {
			modelResponseType, err := getModelResponseType(providerObj.SubType)
			if err != nil {
				return modelUsageMapByResp, err
			}
			if modelResponseType {
				modelUsageMapByResp.imageModelUsageMap[providerName] = usageInfo
			} else {
				modelUsageMapByResp.textModelUsageMap[providerName] = usageInfo
			}
		}
	}
	return modelUsageMapByResp, nil
}

func getPromptIntention(modelUsageMapByResp *modelUsageMapByResponseType, modelProviderMap map[string]*object.Provider, modelProviderObjMap map[string]model.ModelProvider, question string) (string, error) {
	var intention string
	if len(modelUsageMapByResp.imageModelUsageMap) == 0 {
		// If there's no image model provider, the prompt intention is text at first place
		intention = "text"
	} else if len(modelUsageMapByResp.textModelUsageMap) == 0 {
		intention = "image"
	} else {
		res, err := getPromptIntentionHelper(modelUsageMapByResp.textModelUsageMap, modelProviderObjMap, question)
		if err != nil {
			return "", err
		}
		intention = res
	}
	return intention, nil
}

func getFilteredModelUsageMap(modelUsageMap map[string]object.UsageInfo, modelProviderMap map[string]*object.Provider, modelProviderObjMap map[string]model.ModelProvider, question string, writer io.Writer, knowledge []*model.RawMessage, history []*model.RawMessage) (map[string]object.UsageInfo, error) {
	modelUsageMapByResp, err := classifyModelUsageMapByResponseType(modelUsageMap, modelProviderMap, question)
	if err != nil {
		return nil, err
	}

	intention, err := getPromptIntention(modelUsageMapByResp, modelProviderMap, modelProviderObjMap, question)
	if err != nil {
		return nil, err
	}

	modelUsageMapFilteredByIntention := modelUsageMapByResp.filterModelUsageMapByIntention(question, intention)
	filteredModelUsageMap := map[string]object.UsageInfo{}
	for providerName, usageInfo := range modelUsageMapFilteredByIntention {
		providerObj := modelProviderObjMap[providerName]
		dryRunQuestion := "$CasibaseDryRun$" + question
		_, err := providerObj.QueryText(dryRunQuestion, writer, history, "", knowledge)
		if err == nil {
			filteredModelUsageMap[providerName] = usageInfo
		}
	}
	return filteredModelUsageMap, nil
}

func GetIdleModelProvider(modelUsageMap map[string]object.UsageInfo, name string, question string, writer io.Writer, knowledge []*model.RawMessage, history []*model.RawMessage, isFromStore bool) (string, model.ModelProvider, error) {
	if len(modelUsageMap) <= 1 {
		defaultModelProvider, defaultModelProviderObj, err := object.GetModelProviderFromContext("admin", name)
		if err != nil {
			return "", nil, err
		}

		return defaultModelProvider.Name, defaultModelProviderObj, nil
	}

	modelProviderMap, modelProviderObjMap, err := object.GetModelProvidersFromContext("admin", name, isFromStore)
	if err != nil {
		return "", nil, err
	}

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
