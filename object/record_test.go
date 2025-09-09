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

//go:build !skipCi
// +build !skipCi

package object

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/casibase/casibase/util"
	"github.com/schollz/progressbar/v3"
)

func TestUpdateRecordsLocation(t *testing.T) {
	InitConfig()
	util.InitMaxmindFiles()
	util.InitIpDb()

	records, err := getAllRecords()
	if err != nil {
		panic(err)
	}

	bar := progressbar.Default(int64(len(records)))
	var errorRecords []string
	for _, r := range records {
		bar.Add(1)
		if r.Unit == "" || r.Section == "" {
			clientIp := r.ClientIp
			if strings.Contains(clientIp, " ->") {
				parts := strings.Split(clientIp, " ->")
				clientIp = strings.TrimSpace(parts[len(parts)-1])
			}

			locationInfo, err := util.GetInfoFromIP(clientIp)
			if err != nil {
				errorRecords = append(errorRecords, r.Name+": invalid client ip.")
				continue
			}

			r.Region = locationInfo.Country
			r.City = locationInfo.City
			err = UpdateRecordInternal(r.Id, *r)
			if err != nil {
				errorRecords = append(errorRecords, r.Name+": update error.")
			}
		}
	}

	t.Log("Log location information update completed.\n")
	if len(errorRecords) > 0 {
		t.Log("The following logs encountered errors during the update.\n")
		for _, msg := range errorRecords {
			t.Log(" - " + msg)
		}
	}
}

func TestBackfillWorkflowTypeAndQuery(t *testing.T) {
	InitConfig()

	records, err := getAllRecords()
	if err != nil {
		panic(err)
	}

	bar := progressbar.Default(int64(len(records)))
	var errorRecords []string
	var updatedCount int

	isWorkflowAction := func(action string) bool {
		switch action {
		case "add-workflow", "update-workflow", "delete-workflow":
			return true
		default:
			return false
		}
	}

	for _, r := range records {
		bar.Add(1)

		if !isWorkflowAction(r.Action) {
			continue
		}

		needUpdate := false
		if r.Type != "workflow" {
			r.Type = "workflow"
			needUpdate = true
		}

		if r.Object != "" {
			var obj map[string]interface{}
			if err := json.Unmarshal([]byte(r.Object), &obj); err == nil {
				if nameVal, ok := obj["name"]; ok {
					if nameStr, ok2 := nameVal.(string); ok2 && nameStr != "" {
						desired := fmt.Sprintf("%s-%s", r.Type, nameStr)
						if r.Query != desired {
							r.Query = desired
							needUpdate = true
						}
					}
				}
			}
		}

		if needUpdate {
			if err := UpdateRecordInternal(r.Id, *r); err != nil {
				errorRecords = append(errorRecords, fmt.Sprintf("%s: update error", r.Name))
			} else {
				updatedCount++
			}
		}
	}

	t.Logf("Backfilled workflow type/query. Updated: %d\n", updatedCount)
	if len(errorRecords) > 0 {
		t.Log("The following logs encountered errors during the backfill.\n")
		for _, msg := range errorRecords {
			t.Log(" - " + msg)
		}
	}
}
