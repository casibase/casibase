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

	"github.com/casibase/casibase/scan"
	"github.com/casibase/casibase/util"
	"xorm.io/core"
)

type Scan struct {
	Owner       string `xorm:"varchar(100) notnull pk" json:"owner"`
	Name        string `xorm:"varchar(100) notnull pk" json:"name"`
	CreatedTime string `xorm:"varchar(100)" json:"createdTime"`
	UpdatedTime string `xorm:"varchar(100)" json:"updatedTime"`
	DisplayName string `xorm:"varchar(200)" json:"displayName"`

	Asset      string `xorm:"varchar(200)" json:"asset"`
	Provider   string `xorm:"varchar(100)" json:"provider"`
	State      string `xorm:"varchar(100)" json:"state"`
	Command    string `xorm:"varchar(500)" json:"command"`
	ResultText string `xorm:"mediumtext" json:"resultText"`
	
	// New fields for unified scan widget
	TargetMode string `xorm:"varchar(100)" json:"targetMode"` // "Manual Input" or "Asset"
	Target     string `xorm:"varchar(500)" json:"target"`     // Manual input target (IP address or network range)
}

func GetScanCount(owner, field, value string) (int64, error) {
	session := GetDbSession(owner, -1, -1, field, value, "", "")
	return session.Count(&Scan{})
}

func GetScans(owner string) ([]*Scan, error) {
	scans := []*Scan{}
	err := adapter.engine.Desc("created_time").Find(&scans, &Scan{Owner: owner})
	if err != nil {
		return scans, err
	}
	return scans, nil
}

func GetPaginationScans(owner string, offset, limit int, field, value, sortField, sortOrder string) ([]*Scan, error) {
	scans := []*Scan{}
	session := GetDbSession(owner, offset, limit, field, value, sortField, sortOrder)
	err := session.Find(&scans)
	if err != nil {
		return scans, err
	}

	return scans, nil
}

func getScan(owner string, name string) (*Scan, error) {
	if owner == "" || name == "" {
		return nil, nil
	}

	scan := Scan{Owner: owner, Name: name}
	existed, err := adapter.engine.Get(&scan)
	if err != nil {
		return &scan, err
	}

	if existed {
		return &scan, nil
	} else {
		return nil, nil
	}
}

func GetScan(id string) (*Scan, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	return getScan(owner, name)
}

func UpdateScan(id string, scan *Scan) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	if _, err := getScan(owner, name); err != nil {
		return false, err
	}

	affected, err := adapter.engine.ID(core.PK{owner, name}).AllCols().Update(scan)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func AddScan(scan *Scan) (bool, error) {
	affected, err := adapter.engine.Insert(scan)
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func DeleteScan(scan *Scan) (bool, error) {
	affected, err := adapter.engine.ID(core.PK{scan.Owner, scan.Name}).Delete(&Scan{})
	if err != nil {
		return false, err
	}

	return affected != 0, nil
}

func (scan *Scan) GetId() string {
	return fmt.Sprintf("%s/%s", scan.Owner, scan.Name)
}

func StartScan(id string, lang string) (bool, error) {
	owner, name := util.GetOwnerAndNameFromId(id)
	scanObj, err := getScan(owner, name)
	if err != nil {
		return false, err
	}
	if scanObj == nil {
		return false, fmt.Errorf("scan not found")
	}

	// Get the asset
	asset, err := GetAsset(scanObj.Asset)
	if err != nil {
		return false, err
	}
	if asset == nil {
		return false, fmt.Errorf("asset not found")
	}

	// Get the provider
	provider, err := GetProvider(util.GetId(owner, scanObj.Provider))
	if err != nil {
		return false, err
	}
	if provider == nil {
		return false, fmt.Errorf("provider not found")
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(provider.Type, provider.ClientId, lang)
	if err != nil {
		return false, err
	}
	if scanProvider == nil {
		return false, fmt.Errorf("scan provider not supported")
	}

	// Perform scan
	scanObj.State = "Running"
	_, err = UpdateScan(id, scanObj)
	if err != nil {
		return false, err
	}

	// Get the scan target based on asset type
	scanTarget, err := asset.GetScanTarget()
	if err != nil {
		scanObj.State = "Failed"
		scanObj.ResultText = fmt.Sprintf("Error getting scan target: %v", err)
		scanObj.UpdatedTime = util.GetCurrentTime()
		_, _ = UpdateScan(id, scanObj)
		return false, err
	}

	var result string
	if scanObj.Command != "" {
		result, err = scanProvider.ScanWithCommand(scanTarget, scanObj.Command)
	} else {
		result, err = scanProvider.Scan(scanTarget)
	}

	if err != nil {
		scanObj.State = "Failed"
		scanObj.ResultText = fmt.Sprintf("Error: %v", err)
	} else {
		scanObj.State = "Completed"
		scanObj.ResultText = result
	}

	scanObj.UpdatedTime = util.GetCurrentTime()
	_, err = UpdateScan(id, scanObj)
	if err != nil {
		return false, err
	}

	return true, nil
}

// ScanAsset performs a scan on an asset - unified API that combines test-scan and start-scan functionality
// @param providerId: The provider ID (owner/name) for scan provider
// @param scanId: Optional scan ID (owner/name) for saving results to existing scan
// @param targetMode: "Manual Input" or "Asset"
// @param target: IP address or network range (for Manual Input mode)
// @param asset: Asset ID (owner/name) for Asset mode
// @param command: Scan command with optional %s placeholder for target
// @param saveToScan: Whether to save results to scan object (true for scan edit page, false for provider edit page)
func ScanAsset(providerId, scanId, targetMode, target, asset, command string, saveToScan bool, lang string) (string, error) {
	// Get the provider
	provider, err := GetProvider(providerId)
	if err != nil {
		return "", err
	}
	if provider == nil {
		return "", fmt.Errorf("provider not found")
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(provider.Type, provider.ClientId, lang)
	if err != nil {
		return "", err
	}
	if scanProvider == nil {
		return "", fmt.Errorf("scan provider not supported")
	}

	// Determine the scan target
	var scanTarget string
	if targetMode == "Asset" {
		// Get the asset
		assetObj, err := GetAsset(asset)
		if err != nil {
			return "", err
		}
		if assetObj == nil {
			return "", fmt.Errorf("asset not found")
		}

		// Get the scan target from asset
		scanTarget, err = assetObj.GetScanTarget()
		if err != nil {
			return "", fmt.Errorf("error getting scan target: %v", err)
		}
	} else {
		// Use manual input target
		scanTarget = target
	}

	// Perform scan
	var result string
	if command != "" {
		result, err = scanProvider.ScanWithCommand(scanTarget, command)
	} else {
		result, err = scanProvider.Scan(scanTarget)
	}

	if err != nil {
		return "", err
	}

	// If saveToScan is true and scanId is provided, update the scan object with results
	if saveToScan && scanId != "" {
		scanObj, err := GetScan(scanId)
		if err != nil {
			return result, err // Return result even if save fails
		}
		if scanObj != nil {
			scanObj.State = "Completed"
			scanObj.ResultText = result
			scanObj.UpdatedTime = util.GetCurrentTime()
			_, _ = UpdateScan(scanId, scanObj) // Ignore save errors, still return result
		}
	}

	return result, nil
}
