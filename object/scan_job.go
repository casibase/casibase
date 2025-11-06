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

	"github.com/beego/beego/logs"
	scanpkg "github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
	"github.com/robfig/cron/v3"
)

var scanJobCron *cron.Cron

// InitScanJobProcessor initializes the scan job processor with a cron job
func InitScanJobProcessor() {
	scanJobCron = cron.New()
	// Run every second
	_, err := scanJobCron.AddFunc("@every 1s", processPendingScans)
	if err != nil {
		panic(err)
	}
	scanJobCron.Start()
}

// processPendingScans picks up pending scans and executes them
func processPendingScans() {
	// Get all pending scans
	scans, err := GetPendingScans()
	if err != nil {
		logs.Error("processPendingScans() error getting pending scans: %v", err)
		return
	}

	hostname, err := os.Hostname()
	if err != nil {
		logs.Error("processPendingScans() error getting hostname: %v", err)
		return
	}

	for _, scan := range scans {
		// Try to claim this scan job
		claimed, err := claimScanJob(scan, hostname)
		if err != nil {
			logs.Error("processPendingScans() error claiming scan job %s: %v", scan.GetId(), err)
			continue
		}

		if !claimed {
			// Another instance claimed this job
			continue
		}

		// Execute the scan
		executeScanJob(scan, hostname)
	}
}

// claimScanJob attempts to claim a scan job by setting its state to "Running"
// Returns true if the claim was successful, false otherwise
func claimScanJob(scan *Scan, hostname string) (bool, error) {
	// If provider is empty, skip this scan (cannot determine scan type)
	if scan.Provider == "" {
		return false, fmt.Errorf("provider is empty for scan job: %s", scan.Name)
	}

	// Get provider to check scan type
	providerId := util.GetId("admin", scan.Provider)
	provider, err := GetProvider(providerId)
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, fmt.Errorf("The provider: %s is not found", scan.Provider)
	}

	if provider.Type != "Nmap" && provider.Type != "OS Patch" && provider.Type != "Nuclei" && provider.Type != "ZAP" && provider.Type != "Subfinder" {
		return false, fmt.Errorf("The provider type: %s is not supported for provider: %s", provider.Type, provider.Name)
	}

	// Check if required tools are available before claiming the job
	if provider.Type == "Nmap" {
		if !scanpkg.IsNmapAvailable(provider.ClientId) {
			// Don't claim this job if nmap is not available
			return false, nil
		}
	} else if provider.Type == "Nuclei" {
		if !scanpkg.IsNucleiAvailable(provider.ClientId) {
			// Don't claim this job if nuclei is not available
			return false, nil
		}
	} else if provider.Type == "ZAP" {
		if !scanpkg.IsZapAvailable(provider.ClientId) {
			// Don't claim this job if ZAP is not available
			return false, nil
		}
	} else if provider.Type == "Subfinder" {
		if !scanpkg.IsSubfinderAvailable(provider.ClientId) {
			// Don't claim this job if Subfinder is not available
			return false, nil
		}
	}

	// For scans in Asset mode, check if the target asset matches this instance's hostname
	if scan.TargetMode == "Asset" {
		if scan.Asset == "" {
			return false, fmt.Errorf("scan's target mode is \"Asset\" and scan's asset should not be empty for scan job: %s", scan.Name)
		}

		assetId := util.GetIdFromOwnerAndName(scan.Owner, scan.Asset)
		asset, err := GetAsset(assetId)
		if err != nil {
			return false, err
		}
		if asset == nil {
			return false, nil
		}
		// Check if the asset name matches the current hostname
		// This ensures only the Casibase instance on the target machine picks up the job
		if asset.DisplayName != hostname {
			if provider.Type == "OS Patch" {
				return false, nil
			}
		}
	} else if scan.TargetMode == "Manual Input" {
		if scan.Target == "" {
			return false, fmt.Errorf("scan's target mode is \"Manual Input\" and scan's target should not be empty for scan job: %s", scan.Name)
		}

		// For manual input mode, use enhanced target matching logic
		match, err := util.MatchTargetWithMachine(scan.Target, hostname)
		if err != nil {
			return false, fmt.Errorf("error matching target with machine: %v", err)
		}
		if !match {
			return false, nil
		}
	}

	// Try to update the scan state from "Pending" to "Running"
	// This is an atomic operation that will only succeed for one instance
	affected, err := AtomicClaimScan(scan.Owner, scan.Name, hostname)
	if err != nil {
		return false, err
	}
	if affected == 0 {
		logs.Warn("processPendingScans() skipping scan job %s, another instance claimed this job", scan.GetId())
	}

	return affected > 0, nil
}

// executeScanJob executes a scan job
func executeScanJob(scan *Scan, hostname string) {
	defer func() {
		if r := recover(); r != nil {
			logs.Error("executeScanJob() recovered from panic in scan job %s: %v", scan.GetId(), r)
			// Update scan state to failed
			scan.State = "Failed"
			errorMsg := fmt.Sprintf("Error: %v", r)
			scan.Result = errorMsg
			scan.ErrorText = errorMsg
			scan.UpdatedTime = util.GetCurrentTime()
			scan.Runner = hostname
			_, err := UpdateScan(scan.GetId(), scan)
			if err != nil {
				logs.Error("executeScanJob() error updating scan after panic %s: %v", scan.GetId(), err)
			}
		}
	}()

	// Execute the scan
	provider := util.GetIdFromOwnerAndName(scan.Owner, scan.Provider)
	scanResult, err := executeScan(provider, scan.GetId(), scan.TargetMode, scan.Target, scan.Asset, scan.Command, scan.Owner, "en")

	// Update scan with results
	scan.UpdatedTime = util.GetCurrentTime()
	scan.Runner = hostname
	if err != nil {
		scan.State = "Failed"
		errorMsg := fmt.Sprintf("Error: %v", err)
		scan.Result = errorMsg
		scan.ErrorText = errorMsg
	} else {
		scan.State = "Completed"
		scan.RawResult = scanResult.RawResult
		scan.Result = scanResult.Result
		scan.ResultSummary = scanResult.ResultSummary
		scan.ErrorText = ""
	}

	_, err = UpdateScan(scan.GetId(), scan)
	if err != nil {
		logs.Error("executeScanJob() error updating scan %s: %v", scan.GetId(), err)
	}
}
