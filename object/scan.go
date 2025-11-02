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
	"strings"

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

	TargetMode string `xorm:"varchar(100)" json:"targetMode"`
	Target     string `xorm:"varchar(100)" json:"target"`
	Asset      string `xorm:"varchar(100)" json:"asset"`
	Provider   string `xorm:"varchar(100)" json:"provider"`
	State      string `xorm:"varchar(100)" json:"state"`
	Command    string `xorm:"varchar(500)" json:"command"`
	RawResult  string `xorm:"mediumtext" json:"rawResult"`
	Result     string `xorm:"mediumtext" json:"result"`
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

// ScanAsset performs a scan on an asset
// @param provider: The provider ID (owner/name) for scan provider
// @param scan: Optional scan ID (owner/name) for saving results to existing scan
// @param targetMode: "Manual Input" or "Asset"
// @param target: IP address or network range (for Manual Input mode)
// @param asset: Asset name (without owner prefix) for Asset mode
// @param command: Scan command with optional %s placeholder for target
// @param saveToScan: Whether to save results to scan object (true for scan edit page, false for provider edit page)
func ScanAsset(provider, scanParam, targetMode, target, asset, command string, saveToScan bool, lang string) (string, error) {
	// Get the provider
	providerObj, err := GetProvider(provider)
	if err != nil {
		return "", err
	}
	if providerObj == nil {
		return "", fmt.Errorf("provider not found")
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(providerObj.Type, providerObj.ClientId, lang)
	if err != nil {
		return "", err
	}
	if scanProvider == nil {
		return "", fmt.Errorf("scan provider not supported")
	}

	// Determine the scan target
	var scanTarget string
	if targetMode == "Asset" {
		// Handle asset parameter - can be either just name or full ID (owner/name) for backward compatibility
		var fullAssetId string
		if strings.Contains(asset, "/") {
			// Asset already contains owner/name format (backward compatibility)
			fullAssetId = asset
		} else {
			// Asset only contains the name, need to construct full ID
			// Get owner from scan object if available, otherwise from provider
			var owner string
			if scanParam != "" {
				owner, _ = util.GetOwnerAndNameFromId(scanParam)
			} else {
				owner, _ = util.GetOwnerAndNameFromId(provider)
			}
			fullAssetId = fmt.Sprintf("%s/%s", owner, asset)
		}
		
		// Get the asset
		assetObj, err := GetAsset(fullAssetId)
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
	rawResult, err := scanProvider.Scan(scanTarget, command)
	if err != nil {
		return "", err
	}

	// Parse the raw result into structured JSON
	result, err := scanProvider.ParseResult(rawResult)
	if err != nil {
		return "", err
	}

	// If saveToScan is true and scanParam is provided, update the scan object with results
	if saveToScan && scanParam != "" {
		scanObj, err := GetScan(scanParam)
		if err != nil {
			return result, err
		}
		if scanObj != nil {
			scanObj.State = "Completed"
			scanObj.RawResult = rawResult
			scanObj.Result = result
			scanObj.UpdatedTime = util.GetCurrentTime()
			_, _ = UpdateScan(scanParam, scanObj)
		}
	}

	return result, nil
}
