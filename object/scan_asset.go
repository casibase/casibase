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

package object

import (
	"fmt"
	"os"

	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
)

// ScanResult represents the result of a scan operation
type ScanResult struct {
	RawResult     string `json:"rawResult"`
	Result        string `json:"result"`
	ResultSummary string `json:"resultSummary"`
	Runner        string `json:"runner"`
}

// ScanAsset performs a scan on an asset
// @param provider: The provider ID (owner/name) for scan provider
// @param scan: Optional scan ID (owner/name) for saving results to existing scan
// @param targetMode: "Manual Input" or "Asset"
// @param target: IP address or network range (for Manual Input mode)
// @param asset: Asset name for Asset mode
// @param command: Scan command with optional %s placeholder for target
// @param saveToScan: Whether to save results to scan object (true for scan edit page, false for provider edit page)
func ScanAsset(provider, scanParam, targetMode, target, asset, command string, saveToScan bool, lang string) (*ScanResult, error) {
	// If saveToScan is true, set the scan state to "Pending" and return
	// The actual scan will be executed by the scan job processor
	if saveToScan && scanParam != "" {
		scanObj, err := GetScan(scanParam)
		if err != nil {
			return nil, err
		}
		if scanObj == nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "scan:scan not found"))
		}

		scanObj.State = "Pending"
		scanObj.UpdatedTime = util.GetCurrentTime()
		// Clear Runner, ErrorText, and results when re-clicking Scan button
		scanObj.Runner = ""
		scanObj.ErrorText = ""
		scanObj.RawResult = ""
		scanObj.Result = ""
		scanObj.ResultSummary = ""
		_, err = UpdateScan(scanParam, scanObj)
		if err != nil {
			return nil, err
		}

		return &ScanResult{
			RawResult: "",
			Result:    "",
		}, nil
	}

	// For provider edit page (saveToScan=false), execute scan immediately
	// Extract owner from provider ID
	owner := "admin" // Default owner
	if provider != "" {
		providerObj, err := GetProvider(provider)
		if err == nil && providerObj != nil {
			owner = providerObj.Owner
		}
	}
	return executeScan(provider, scanParam, targetMode, target, asset, command, owner, lang)
}

// executeScan performs the actual scan execution
func executeScan(provider, scanParam, targetMode, target, asset, command, owner string, lang string) (*ScanResult, error) {
	// Get the hostname to identify the runner
	hostname, err := os.Hostname()
	if err != nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "scan:error getting hostname: %v"), err)
	}

	// Get the provider
	providerObj, err := GetProvider(provider)
	if err != nil {
		return nil, err
	}
	if providerObj == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "scan:provider not found"))
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(providerObj.Type, providerObj.ClientId, lang)
	if err != nil {
		return nil, err
	}
	if scanProvider == nil {
		return nil, fmt.Errorf(i18n.Translate(lang, "scan:scan provider not supported"))
	}

	// Determine the scan target
	var scanTarget string
	if targetMode == "Asset" {
		assetId := util.GetIdFromOwnerAndName(owner, asset)

		// Get the asset
		assetObj, err := GetAsset(assetId)
		if err != nil {
			return nil, err
		}
		if assetObj == nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "scan:asset not found"))
		}

		// Get the scan target from asset
		scanTarget, err = assetObj.GetScanTarget()
		if err != nil {
			return nil, fmt.Errorf(i18n.Translate(lang, "scan:error getting scan target: %v"), err)
		}
	} else {
		// Use manual input target
		scanTarget = target
	}

	// Perform scan
	rawResult, err := scanProvider.Scan(scanTarget, command)
	if err != nil {
		return nil, err
	}

	// Parse the raw result into structured JSON
	result, err := scanProvider.ParseResult(rawResult)
	if err != nil {
		return nil, err
	}

	// Generate result summary
	resultSummary := scanProvider.GetResultSummary(result)

	return &ScanResult{RawResult: rawResult, Result: result, ResultSummary: resultSummary, Runner: hostname}, nil
}

// GetPendingScans returns all scans with state "Pending"
func GetPendingScans() ([]*Scan, error) {
	scans := []*Scan{}
	err := adapter.engine.Where("state = ?", "Pending").Find(&scans)
	if err != nil {
		return nil, err
	}
	return scans, nil
}

// AtomicClaimScan atomically updates a scan's state from "Pending" to "Running"
// This operation will only succeed for one instance due to the WHERE condition on state
// Returns the number of affected rows
func AtomicClaimScan(owner, name, hostname string) (int64, error) {
	affected, err := adapter.engine.Table(&Scan{}).
		Where("owner = ? AND name = ? AND state = ?", owner, name, "Pending").
		Update(map[string]interface{}{
			"state":        "Running",
			"runner":       hostname,
			"updated_time": util.GetCurrentTime(),
		})
	return affected, err
}
