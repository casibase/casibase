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
	"encoding/json"

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
)

// GetScans
// @Title GetScans
// @Tag Scan API
// @Description get all scans
// @Param   pageSize     query    string  false        "The size of each page"
// @Param   p     query    string  false        "The number of the page"
// @Success 200 {object} object.Scan The Response object
// @router /get-scans [get]
func (c *ApiController) GetScans() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	if limit == "" || page == "" {
		scans, err := object.GetScans(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(scans)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetScanCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		scans, err := object.GetPaginationScans(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(scans, paginator.Nums())
	}
}

// GetScan
// @Title GetScan
// @Tag Scan API
// @Description get scan
// @Param   id     query    string  true        "The id ( owner/name ) of the scan"
// @Success 200 {object} object.Scan The Response object
// @router /get-scan [get]
func (c *ApiController) GetScan() {
	id := c.Input().Get("id")

	scan, err := object.GetScan(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(scan)
}

// UpdateScan
// @Title UpdateScan
// @Tag Scan API
// @Description update scan
// @Param   id     query    string  true        "The id ( owner/name ) of the scan"
// @Param   body    body   object.Scan  true        "The details of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /update-scan [post]
func (c *ApiController) UpdateScan() {
	id := c.Input().Get("id")

	var scan object.Scan
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &scan)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.UpdateScan(id, &scan))
}

// AddScan
// @Title AddScan
// @Tag Scan API
// @Description add a scan
// @Param   body    body   object.Scan  true        "The details of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /add-scan [post]
func (c *ApiController) AddScan() {
	var scan object.Scan
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &scan)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.AddScan(&scan))
}

// DeleteScan
// @Title DeleteScan
// @Tag Scan API
// @Description delete a scan
// @Param   body    body   object.Scan  true        "The details of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-scan [post]
func (c *ApiController) DeleteScan() {
	var scan object.Scan
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &scan)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(object.DeleteScan(&scan))
}

// InstallPatch
// @Title InstallPatch
// @Tag Scan API
// @Description install an OS patch by KB number
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   kb query string true "The KB number of the patch to install"
// @Success 200 {object} controllers.Response The Response object with InstallProgress
// @router /install-patch [post]
func (c *ApiController) InstallPatch() {
	providerID := c.Input().Get("provider")
	kb := c.Input().Get("kb")

	if providerID == "" {
		c.ResponseError("Provider ID is required")
		return
	}

	if kb == "" {
		c.ResponseError("KB number is required")
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

	// Install the patch
	progress, err := osPatchProvider.InstallPatch(kb)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(progress)
}

// MonitorPatchProgress
// @Title MonitorPatchProgress
// @Tag Scan API
// @Description monitor the installation progress of an OS patch
// @Param   provider query string true "The provider ID (owner/name)"
// @Param   kb query string true "The KB number of the patch being installed"
// @Success 200 {object} controllers.Response The Response object with InstallProgress
// @router /monitor-patch-progress [get]
func (c *ApiController) MonitorPatchProgress() {
	providerID := c.Input().Get("provider")
	kb := c.Input().Get("kb")

	if providerID == "" {
		c.ResponseError("Provider ID is required")
		return
	}

	if kb == "" {
		c.ResponseError("KB number is required")
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

	// Start monitoring (with 5 second intervals)
	progressChan, err := osPatchProvider.MonitorInstallProgress(kb, 5)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// Get the first progress update
	progress := <-progressChan

	c.ResponseOk(progress)
}
