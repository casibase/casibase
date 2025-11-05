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
	"time"

	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
)

const (
	// patchProgressTimeout is the maximum time to wait for patch installation progress updates
	patchProgressTimeout = 30 * time.Second
	// patchProgressPollingInterval is the interval for polling patch installation progress
	patchProgressPollingInterval = 5
)

// InstallPatch
// @Title InstallPatch
// @Tag Patch API
// @Description install an OS patch by patch ID (KB number or title)
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   patchId query string true "The patch ID (KB number or title)"
// @Param   scan query string false "The scan ID (owner/name) for async execution"
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

	// If scan parameter is provided, use async execution (similar to ScanAsset)
	if scanParam != "" {
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
		return
	}

	// For backward compatibility: if no scan parameter, execute synchronously
	// Create an OsPatchScanProvider instance
	osPatchProvider, err := scan.NewOsPatchScanProvider(provider.ClientId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Install the patch
	progress, err := osPatchProvider.InstallPatch(patchId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(progress)
}

// MonitorPatchProgress
// @Title MonitorPatchProgress
// @Tag Patch API
// @Description monitor the installation progress of an OS patch
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   patchId query string true "The patch ID (KB number or title) being installed"
// @Success 200 {object} controllers.Response The Response object with InstallProgress
// @router /monitor-patch-progress [get]
func (c *ApiController) MonitorPatchProgress() {
	providerID := c.Input().Get("provider")
	patchId := c.Input().Get("patchId")

	if providerID == "" {
		c.ResponseError("Provider ID is required")
		return
	}

	if patchId == "" {
		c.ResponseError("Patch ID is required")
		return
	}

	// Get the provider to check if it's an OS Patch provider
	provider, err := object.GetProvider(providerID)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if provider.Type != "OS Patch" {
		c.ResponseError("Provider must be of type 'OS Patch'")
		return
	}

	// Create an OsPatchScanProvider instance
	osPatchProvider, err := scan.NewOsPatchScanProvider(provider.ClientId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Start monitoring with configured polling interval
	progressChan, err := osPatchProvider.MonitorInstallProgress(patchId, patchProgressPollingInterval)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Get the first progress update with a timeout
	select {
	case progress := <-progressChan:
		c.ResponseOk(progress)
	case <-time.After(patchProgressTimeout):
		c.ResponseError("Timeout waiting for progress update")
	}
}
