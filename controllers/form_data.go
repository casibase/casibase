// Copyright 2025 The Casibase Authors. All Rights Reserved.
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
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetFormData
// @Title GetFormData
// @Tag Form API
// @Description get forms
// @Param owner query string true "The owner of form"
// @Success 200 {array} object.Form The Response object
// @router /get-form-data [get]
func (c *ApiController) GetFormData() {
	owner := c.Input().Get("owner")
	form := c.Input().Get("form")
	limitStr := c.Input().Get("pageSize")
	pageStr := c.Input().Get("p")

	formObj, err := object.GetForm(util.GetId(owner, form))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if formObj == nil {
		c.ResponseError(fmt.Sprintf("The form: %s is not found", util.GetId(owner, form)))
		return
	}

	jsonData, err := json.Marshal(formObj)
	if err != nil {
		c.ResponseError("Failed to serialize formObj: " + err.Error())
		return
	}

	blockchainProvider, err := object.GetDefaultBlockchainProvider()
	if blockchainProvider == nil {
		c.ResponseError("The default blockchain provider is not found")
		return
	}

	chainserverUrl := blockchainProvider.ProviderUrl
	if chainserverUrl == "" {
		c.ResponseError("The default blockchain providers' Provider URL cannot be empty. The default value is: 'http://localhost:13900'")
	}

	url := fmt.Sprintf("%s/api/get-form-data?pageSize=%s&p=%s", chainserverUrl, limitStr, pageStr)
	resp, err := http.Post(url, "application/json", bytes.NewReader(jsonData))
	if err != nil {
		c.ResponseError("HTTP request failed: " + err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.ResponseError("Failed to read response body: " + err.Error())
		return
	}

	c.Ctx.Output.Header("Content-Type", "application/json")
	c.Ctx.Output.Body(body)
}
