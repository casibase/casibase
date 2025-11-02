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

// StartScan
// @Title StartScan
// @Tag Scan API
// @Description start a scan
// @Param   id     query    string  true        "The id ( owner/name ) of the scan"
// @Success 200 {object} controllers.Response The Response object
// @router /start-scan [post]
func (c *ApiController) StartScan() {
	id := c.Input().Get("id")

	c.ResponseOk(object.StartScan(id, c.GetAcceptLanguage()))
}

// ScanAsset
// @Title ScanAsset
// @Tag Scan API
// @Description unified API for scanning assets (combines test-scan and start-scan functionality)
// @Param providerId query string true "The provider ID (owner/name)"
// @Param scanId query string false "The scan ID (owner/name) for saving results"
// @Param targetMode query string true "Target mode: 'Manual Input' or 'Asset'"
// @Param target query string false "Manual input target (IP address or network range)"
// @Param asset query string false "Asset ID (owner/name) for Asset mode"
// @Param command query string false "Scan command with optional %s placeholder for target"
// @Param saveToScan query string false "Whether to save results to scan object (true/false)"
// @Success 200 {object} controllers.Response The Response object
// @router /scan-asset [post]
func (c *ApiController) ScanAsset() {
	providerId := c.Input().Get("providerId")
	scanId := c.Input().Get("scanId")
	targetMode := c.Input().Get("targetMode")
	target := c.Input().Get("target")
	asset := c.Input().Get("asset")
	command := c.Input().Get("command")
	saveToScan := c.Input().Get("saveToScan") == "true"

	result, err := object.ScanAsset(providerId, scanId, targetMode, target, asset, command, saveToScan, c.GetAcceptLanguage())
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(result)
}
