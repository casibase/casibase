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

	"github.com/beego/beego/logs"
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
		panic(fmt.Sprintf("Failed to add cron job with schedule %s: %v", schedule, err))
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
	s.ResultText = "Scan started..."
	_, err := UpdateScan(scanId, s)
	if err != nil {
		logs.Error("executeScan() failed to update scan state to Running: %v", err)
		return
	}

	// Use the existing ScanAsset function to execute the scan
	provider := s.Provider
	target := s.Target
	asset := s.Asset
	targetMode := s.TargetMode
	command := s.Command

	// Execute the scan using ScanAsset
	result, err := ScanAsset(provider, scanId, targetMode, target, asset, command, true, "en")
	
	if err != nil {
		// Update scan with error
		scanObj, getErr := GetScan(scanId)
		if getErr != nil {
			logs.Error("executeScan() failed to get scan after error: %v", getErr)
			return
		}
		if scanObj != nil {
			scanObj.State = "Failed"
			scanObj.ResultText = fmt.Sprintf("Scan failed: %v", err)
			scanObj.UpdatedTime = util.GetCurrentTime()
			_, updateErr := UpdateScan(scanId, scanObj)
			if updateErr != nil {
				logs.Error("executeScan() failed to update scan error: %v", updateErr)
			}
		}
		logs.Error("Scan failed: %s - %v", scanId, err)
		return
	}

	logs.Info("Scan completed successfully: %s", scanId)
}
