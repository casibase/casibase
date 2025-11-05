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
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// InstallPatch
// @Title InstallPatch
// @Tag Patch API
// @Description install an OS patch by patch ID (KB number or title) asynchronously
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   patchId query string true "The patch ID (KB number or title)"
// @Param   scan query string true "The scan ID (owner/name) for async execution"
// @Success 200 {object} controllers.Response The Response object
// @router /install-patch [post]
func (c *ApiController) InstallPatch() {
	providerName := c.Input().Get("provider")
	patchId := c.Input().Get("patchId")
	scanParam := c.Input().Get("scan")

	if providerName == "" {
		c.ResponseError("Provider is required")
		return
	}

	if patchId == "" {
		c.ResponseError("Patch ID is required")
		return
	}

	if scanParam == "" {
		c.ResponseError("Scan parameter is required")
		return
	}

	// Get the provider to check if it's an OS Patch provider
	providerId := util.GetIdFromOwnerAndName("admin", providerName)
	provider, err := object.GetProvider(providerId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if provider.Type != "OS Patch" {
		c.ResponseError("Provider must be of type 'OS Patch'")
		return
	}

	// Get the scan object
	scanObj, err := object.GetScan(scanParam)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if scanObj == nil {
		c.ResponseError("Scan not found")
		return
	}

	// Update scan with install command and set state to Pending
	scanObj.Command = "install:" + patchId
	scanObj.State = "Pending"
	scanObj.UpdatedTime = util.GetCurrentTime()
	// Clear previous results
	scanObj.Runner = ""
	scanObj.ErrorText = ""
	scanObj.RawResult = ""
	scanObj.Result = ""
	scanObj.ResultSummary = ""

	_, err = object.UpdateScan(scanParam, scanObj)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(map[string]interface{}{
		"status": "Pending",
	})
}
