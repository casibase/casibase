// Copyright 2023 The Casibase Authors. All Rights Reserved.
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

import "github.com/casdoor/casdoor-go-sdk/casdoorsdk"

func getStorageProviders() ([]*casdoorsdk.Provider, error) {
	providers, err := casdoorsdk.GetProviders()
	if err != nil {
		return providers, err
	}

	res := []*casdoorsdk.Provider{}
	for _, provider := range providers {
		if provider.Category == "Storage" {
			res = append(res, provider)
		}
	}
	return res, nil
}

// GetStorageProviders
// @Title GetStorageProviders
// @Tag Storage Provider API
// @Description get storage providers
// @Success 200 {array} object.Provider The Response object
// @router /get-storage-providers [get]
func (c *ApiController) GetStorageProviders() {
	// owner := c.Input().Get("owner")

	providers, err := getStorageProviders()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(providers)
}
