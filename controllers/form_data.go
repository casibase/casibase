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
	"fmt"

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

	formObj, err := object.GetForm(util.GetId(owner, form))
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if formObj == nil {
		c.ResponseError(fmt.Sprintf("The form: %s is not found", util.GetId(owner, form)))
		return
	}

	var result []map[string]string
	for i := 1; i <= 100; i++ {
		itemMap := make(map[string]string)
		for _, item := range formObj.FormItems {
			itemMap[item.Name] = fmt.Sprintf("%s %d", item.Name, i)
		}
		result = append(result, itemMap)
	}

	c.ResponseOk(result, len(formObj.FormItems))
}
