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
	"github.com/casibase/casibase/util"
	"github.com/robfig/cron/v3"
)

var scanJobCron *cron.Cron

// InitScanJobProcessor initializes the scan job processor with a cron job
func InitScanJobProcessor() {
	scanJobCron = cron.New()
	// Run every minute
	_, err := scanJobCron.AddFunc("@every 1m", processPendingScans)
	if err != nil {
		panic(err)
	}
	scanJobCron.Start()
}

// processPendingScans picks up pending scans and executes them
func processPendingScans() {
	// Get all pending scans
	scans, err := getPendingScans()
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

		// Execute the scan in a goroutine to avoid blocking
		go executeScanJob(scan, hostname)
	}
}

// getPendingScans returns all scans with state "Pending"
func getPendingScans() ([]*Scan, error) {
	scans := []*Scan{}
	err := adapter.engine.Where("state = ?", "Pending").Find(&scans)
	if err != nil {
		return nil, err
	}
	return scans, nil
}

// claimScanJob attempts to claim a scan job by setting its state to "Running"
// Returns true if the claim was successful, false otherwise
func claimScanJob(scan *Scan, hostname string) (bool, error) {
	// For OS Patch scans, check if this instance should execute the scan
	// OS Patch scans can only be run on the local machine (they use PowerShell locally)
	// so only the Casibase instance running on the target machine should claim the job
	if scan.Provider != "" {
		provider, err := GetProvider(scan.Provider)
		if err == nil && provider != nil && provider.Type == "OS Patch" {
			// For OS Patch scans, check if the target asset matches this instance's hostname
			if scan.TargetMode == "Asset" && scan.Asset != "" {
				asset, err := GetAsset(util.GetIdFromOwnerAndName(scan.Owner, scan.Asset))
				if err == nil && asset != nil {
					// Check if the asset name matches the current hostname
					// This ensures only the Casibase instance on the target machine picks up the job
					if asset.Name != hostname {
						return false, nil
					}
				}
			} else if scan.TargetMode == "Manual Input" && scan.Target != "" {
				// For manual input mode, only claim if target is localhost or 127.0.0.1
				if scan.Target != "localhost" && scan.Target != "127.0.0.1" {
					return false, nil
				}
			}
		}
	}

	// Try to update the scan state from "Pending" to "Running"
	// This is an atomic operation that will only succeed for one instance
	affected, err := adapter.engine.Where("owner = ? AND name = ? AND state = ?", scan.Owner, scan.Name, "Pending").
		Update(map[string]interface{}{
			"state":        "Running",
			"runner":       hostname,
			"updated_time": util.GetCurrentTime(),
		})

	if err != nil {
		return false, err
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
			scan.Result = fmt.Sprintf("Error: %v", r)
			scan.UpdatedTime = util.GetCurrentTime()
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
	if err != nil {
		scan.State = "Failed"
		scan.Result = fmt.Sprintf("Error: %v", err)
	} else {
		scan.State = "Completed"
		scan.RawResult = scanResult.RawResult
		scan.Result = scanResult.Result
	}

	_, err = UpdateScan(scan.GetId(), scan)
	if err != nil {
		logs.Error("executeScanJob() error updating scan %s: %v", scan.GetId(), err)
	}
}
