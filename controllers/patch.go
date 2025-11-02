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
// @Description install an OS patch by KB number or Title
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   kb query string false "The KB number of the patch to install"
// @Param   title query string false "The title of the patch to install (required if kb is not provided)"
// @Success 200 {object} controllers.Response The Response object with InstallProgress
// @router /install-patch [post]
func (c *ApiController) InstallPatch() {
	providerID := c.Input().Get("provider")
	kb := c.Input().Get("kb")
	title := c.Input().Get("title")

	if providerID == "" {
		c.ResponseError("Provider ID is required")
		return
	}

	if kb == "" && title == "" {
		c.ResponseError("Either KB number or Title is required")
		return
	}
	// Note: KB and Title parameter validation is performed by OsPatchScanProvider.InstallPatch()
	// to prevent command injection

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

	// Install the patch
	progress, err := osPatchProvider.InstallPatch(kb, title)
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
// @Param   kb query string false "The KB number of the patch being installed"
// @Param   title query string false "The title of the patch being installed (required if kb is not provided)"
// @Success 200 {object} controllers.Response The Response object with InstallProgress
// @router /monitor-patch-progress [get]
func (c *ApiController) MonitorPatchProgress() {
	providerID := c.Input().Get("provider")
	kb := c.Input().Get("kb")
	title := c.Input().Get("title")

	if providerID == "" {
		c.ResponseError("Provider ID is required")
		return
	}

	if kb == "" && title == "" {
		c.ResponseError("Either KB number or Title is required")
		return
	}
	// Note: KB and Title parameter validation is performed by OsPatchScanProvider.MonitorInstallProgress()
	// to prevent command injection

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
	progressChan, err := osPatchProvider.MonitorInstallProgress(kb, title, patchProgressPollingInterval)
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
