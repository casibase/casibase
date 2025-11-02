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
	"sync"
	"time"

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
	"github.com/robfig/cron/v3"
)

var (
	scanWorkerMutex    sync.Mutex
	currentHostname    string
	activeScanTasks    = make(map[string]bool) // Track active scan tasks by scan ID
	activeScanTasksMux sync.Mutex
)

// InitScanWorker initializes the background scan worker
func InitScanWorker() {
	// Get the hostname once at startup
	hostname, err := os.Hostname()
	if err != nil {
		logs.Error("Failed to get hostname: %v, scan worker will not start", err)
		return
	}
	currentHostname = hostname
	logs.Info("Scan worker initialized for hostname: %s", currentHostname)

	// Run once immediately on startup
	go scanPendingScans()

	// Create cron job to check for pending scans every minute
	cronJob := cron.New()
	schedule := "@every 1m"
	_, err = cronJob.AddFunc(schedule, scanPendingScans)
	if err != nil {
		panic(err)
	}

	cronJob.Start()
}

// scanPendingScans checks for scans that need to be executed on this machine
func scanPendingScans() {
	scanWorkerMutex.Lock()
	defer scanWorkerMutex.Unlock()

	// Find scans where state is "Pending" and asset.displayName matches our hostname
	scans := []*Scan{}
	err := adapter.engine.Where("state = ?", "Pending").Find(&scans)
	if err != nil {
		logs.Error("scanPendingScans() failed to query pending scans: %v", err)
		return
	}

	if len(scans) == 0 {
		return
	}

	for _, s := range scans {
		// Skip if already running
		if isTaskActive(s.GetId()) {
			continue
		}

		// Get the asset to check displayName
		assetObj, err := GetAsset(s.Asset)
		if err != nil {
			logs.Error("scanPendingScans() failed to get asset %s: %v", s.Asset, err)
			continue
		}
		if assetObj == nil {
			logs.Error("scanPendingScans() asset not found: %s", s.Asset)
			continue
		}

		// Check if this scan is for our machine
		if assetObj.DisplayName != currentHostname {
			continue
		}

		// Mark as running and start the scan in a goroutine
		markTaskActive(s.GetId(), true)
		go executeScan(s)
	}
}

// isTaskActive checks if a scan task is currently active
func isTaskActive(scanId string) bool {
	activeScanTasksMux.Lock()
	defer activeScanTasksMux.Unlock()
	return activeScanTasks[scanId]
}

// markTaskActive marks a scan task as active or inactive
func markTaskActive(scanId string, active bool) {
	activeScanTasksMux.Lock()
	defer activeScanTasksMux.Unlock()
	if active {
		activeScanTasks[scanId] = true
	} else {
		delete(activeScanTasks, scanId)
	}
}

// executeScan executes a scan and saves results progressively
func executeScan(s *Scan) {
	defer markTaskActive(s.GetId(), false)

	scanId := s.GetId()
	logs.Info("Starting scan execution: %s for asset: %s", scanId, s.Asset)

	// Update scan state to "Running"
	s.State = "Running"
	s.UpdatedTime = util.GetCurrentTime()
	s.ResultText = ""
	_, err := UpdateScan(scanId, s)
	if err != nil {
		logs.Error("executeScan() failed to update scan state to Running: %v", err)
		return
	}

	// Get the provider
	providerObj, err := GetProvider(s.Provider)
	if err != nil {
		updateScanError(scanId, fmt.Sprintf("Failed to get provider: %v", err))
		return
	}
	if providerObj == nil {
		updateScanError(scanId, "Provider not found")
		return
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(providerObj.Type, providerObj.ClientId, "en")
	if err != nil {
		updateScanError(scanId, fmt.Sprintf("Failed to create scan provider: %v", err))
		return
	}
	if scanProvider == nil {
		updateScanError(scanId, "Scan provider not supported")
		return
	}

	// Get the asset
	assetObj, err := GetAsset(s.Asset)
	if err != nil {
		updateScanError(scanId, fmt.Sprintf("Failed to get asset: %v", err))
		return
	}
	if assetObj == nil {
		updateScanError(scanId, "Asset not found")
		return
	}

	// Determine the scan target
	var scanTarget string
	if s.TargetMode == "Asset" {
		scanTarget, err = assetObj.GetScanTarget()
		if err != nil {
			updateScanError(scanId, fmt.Sprintf("Error getting scan target: %v", err))
			return
		}
	} else {
		scanTarget = s.Target
	}

	// For OS Patch scans, we need to handle progressive updates
	if providerObj.Type == "OS Patch" {
		executeOsPatchScan(scanId, scanProvider, scanTarget, s.Command)
	} else {
		// For other scan types, execute normally
		executeRegularScan(scanId, scanProvider, scanTarget, s.Command)
	}
}

// executeOsPatchScan executes an OS patch scan with progress reporting
func executeOsPatchScan(scanId string, scanProvider scan.ScanProvider, scanTarget string, command string) {
	// Update status to indicate scan is in progress
	updateScanProgress(scanId, "Scanning for OS patches...")

	// Execute the scan
	var result string
	var err error
	if command != "" {
		result, err = scanProvider.ScanWithCommand(scanTarget, command)
	} else {
		result, err = scanProvider.Scan(scanTarget)
	}

	if err != nil {
		updateScanError(scanId, fmt.Sprintf("Scan failed: %v", err))
		return
	}

	// Update with final result
	scanObj, err := GetScan(scanId)
	if err != nil {
		logs.Error("executeOsPatchScan() failed to get scan: %v", err)
		return
	}
	if scanObj != nil {
		scanObj.State = "Completed"
		scanObj.ResultText = result
		scanObj.UpdatedTime = util.GetCurrentTime()
		_, err = UpdateScan(scanId, scanObj)
		if err != nil {
			logs.Error("executeOsPatchScan() failed to update scan with final result: %v", err)
		} else {
			logs.Info("Scan completed successfully: %s", scanId)
		}
	}
}

// executeRegularScan executes a regular scan (non-OS Patch)
func executeRegularScan(scanId string, scanProvider scan.ScanProvider, scanTarget string, command string) {
	// Execute the scan
	var result string
	var err error
	if command != "" {
		result, err = scanProvider.ScanWithCommand(scanTarget, command)
	} else {
		result, err = scanProvider.Scan(scanTarget)
	}

	if err != nil {
		updateScanError(scanId, fmt.Sprintf("Scan failed: %v", err))
		return
	}

	// Update with final result
	scanObj, err := GetScan(scanId)
	if err != nil {
		logs.Error("executeRegularScan() failed to get scan: %v", err)
		return
	}
	if scanObj != nil {
		scanObj.State = "Completed"
		scanObj.ResultText = result
		scanObj.UpdatedTime = util.GetCurrentTime()
		_, err = UpdateScan(scanId, scanObj)
		if err != nil {
			logs.Error("executeRegularScan() failed to update scan with final result: %v", err)
		} else {
			logs.Info("Scan completed successfully: %s", scanId)
		}
	}
}

// updateScanProgress updates the scan with progress information
func updateScanProgress(scanId string, progressText string) {
	scanObj, err := GetScan(scanId)
	if err != nil {
		logs.Error("updateScanProgress() failed to get scan: %v", err)
		return
	}
	if scanObj != nil {
		scanObj.ResultText = progressText
		scanObj.UpdatedTime = util.GetCurrentTime()
		_, err = UpdateScan(scanId, scanObj)
		if err != nil {
			logs.Error("updateScanProgress() failed to update scan progress: %v", err)
		}
	}
}

// updateScanError updates the scan with error information
func updateScanError(scanId string, errorText string) {
	logs.Error("Scan failed: %s - %s", scanId, errorText)
	scanObj, err := GetScan(scanId)
	if err != nil {
		logs.Error("updateScanError() failed to get scan: %v", err)
		return
	}
	if scanObj != nil {
		scanObj.State = "Failed"
		scanObj.ResultText = errorText
		scanObj.UpdatedTime = util.GetCurrentTime()
		_, err = UpdateScan(scanId, scanObj)
		if err != nil {
			logs.Error("updateScanError() failed to update scan error: %v", err)
		}
	}
}

// GetCurrentHostname returns the current machine's hostname
func GetCurrentHostname() string {
	return currentHostname
}
