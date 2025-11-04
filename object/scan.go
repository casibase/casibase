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

	TargetMode string `xorm:"varchar(100)" json:"targetMode"`
	Target     string `xorm:"varchar(100)" json:"target"`
	Asset      string `xorm:"varchar(100)" json:"asset"`
	Provider   string `xorm:"varchar(100)" json:"provider"`
	State      string `xorm:"varchar(100)" json:"state"`
	Runner     string `xorm:"varchar(100)" json:"runner"`
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
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return nil, err
	}
	return getScan(owner, name)
}

func UpdateScan(id string, scan *Scan) (bool, error) {
	owner, name, err := util.GetOwnerAndNameFromIdWithError(id)
	if err != nil {
		return false, err
	}
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

// ScanResult represents the result of a scan operation
type ScanResult struct {
	RawResult string `json:"rawResult"`
	Result    string `json:"result"`
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
			return nil, fmt.Errorf("scan not found")
		}

		scanObj.State = "Pending"
		scanObj.UpdatedTime = util.GetCurrentTime()
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
	// Get the provider
	providerObj, err := GetProvider(provider)
	if err != nil {
		return nil, err
	}
	if providerObj == nil {
		return nil, fmt.Errorf("provider not found")
	}

	// Create scan provider
	scanProvider, err := scan.GetScanProvider(providerObj.Type, providerObj.ClientId, lang)
	if err != nil {
		return nil, err
	}
	if scanProvider == nil {
		return nil, fmt.Errorf("scan provider not supported")
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
			return nil, fmt.Errorf("asset not found")
		}

		// Get the scan target from asset
		scanTarget, err = assetObj.GetScanTarget()
		if err != nil {
			return nil, fmt.Errorf("error getting scan target: %v", err)
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

	return &ScanResult{RawResult: rawResult, Result: result}, nil
}
