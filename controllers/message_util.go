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

	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
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

func ConvertMessageDataToJSON(data string) ([]byte, error) {
	jsonData := map[string]string{"text": data}
	jsonBytes, err := json.Marshal(jsonData)
	if err != nil {
		return nil, err
	}
	return jsonBytes, nil
}

func GetIdleModelProvider(store object.Store, modelProviders []*object.Provider, modelProviderObjs []model.ModelProvider, defaultModelProvider *object.Provider, defaultModelProviderObj model.ModelProvider) (string, model.ModelProvider, error) {
	minTokenCount := int(^uint(0) >> 1)
	var minProvider string

	if len(store.ModelUsageMap) == 0 {
		return defaultModelProvider.Name, defaultModelProviderObj, nil
	}

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
	return "", nil, fmt.Errorf("")
}
