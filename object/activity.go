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
	"errors"
	"fmt"
	"time"
)

type Activity struct {
	Date       string `json:"date"`
	FieldCount map[string]int
}

func getTargetfieldValue(record *Record, fieldName string) (string, error) {
	switch fieldName {
	case "action":
		return record.Action, nil
	case "language":
		return record.Language, nil
	case "client_ip":
		return record.ClientIp, nil
	case "owner":
		return record.Owner, nil
	case "organization":
		return record.Organization, nil
	case "user_agent":
		return record.UserAgent, nil
	case "response":
		status := "error"
		if record.Response == "{\"status\":\"ok\",\"msg\":\"\"}" {
			status = "ok"
		}
		return status, nil
	case "unit":
		return record.Unit, nil
	case "section":
		return record.Section, nil
	case "city":
		return record.City, nil
	case "region":
		return record.Region, nil
	case "diseaseCategory":
		return record.DiseaseCategory, nil

	}
	return "", errors.New("no matched field")
}

func GetActivities(days int, user string, fieldNames []string) (map[string][]*Activity, error) {
	records, err := getAllRecords()
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	// Adjusted to include today in the count by subtracting days-1
	startDateTime := now.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)

	resp := make(map[string][]*Activity)
	for j := 0; j < len(fieldNames); j++ {
		// Adjusted the size to days, as we're now including today
		activities := make([]*Activity, days)
		for i := 0; i < days; i++ {
			activities[i] = &Activity{
				Date:       startDateTime.AddDate(0, 0, i).Format("2006-01-02"),
				FieldCount: make(map[string]int),
			}
		}
		resp[fieldNames[j]] = activities
	}

	for _, record := range records {
		if !(record.User == user || user == "All") {
			continue
		}
		recordTime, _ := time.Parse(time.RFC3339, record.CreatedTime)

		if recordTime.Before(startDateTime) {
			break
		}

		// Find the date index for the message
		dayIndex := int(recordTime.Sub(startDateTime).Hours() / 24)
		if dayIndex < 0 || dayIndex >= days {
			continue
		}
		for _, fieldName := range fieldNames {
			value, err := getTargetfieldValue(record, fieldName)
			if err != nil {
				return nil, fmt.Errorf("failed to parse record: name %s, field %s, error: %v", record.Name, fieldName, err)
			}

			if value != "" {
				activity := resp[fieldName]
				activity[dayIndex].FieldCount[value] += 1
			}
		}
	}

	for i := 1; i < days; i++ {
		for _, activities := range resp {
			for action, count := range activities[i-1].FieldCount {
				activities[i].FieldCount[action] += count
			}
		}
	}

	return resp, nil
}
