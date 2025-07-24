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
	"encoding/json"
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
		var data map[string]interface{}
		err := json.Unmarshal([]byte(record.Response), &data)
		if err != nil {
			return "", err
		}
		status, ok := data["status"].(string)
		if ok {
			return status, nil
		} else {
			return "", err
		}
	}
	return "", errors.New("no matched field")
}

func GetActivities(days int, user string, fieldName string) ([]*Activity, error) {
	records := []*Record{}
	err := adapter.engine.Desc("created_time").Find(&records, &Record{Owner: "casbin"})
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	// Adjusted to include today in the count by subtracting days-1
	startDateTime := now.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)

	// Adjusted the size to days, as we're now including today
	activities := make([]*Activity, days)

	for i := 0; i < days; i++ {
		activities[i] = &Activity{
			Date:       startDateTime.AddDate(0, 0, i).Format("2006-01-02"),
			FieldCount: make(map[string]int),
		}
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
		value, err := getTargetfieldValue(record, fieldName)
		if err != nil {
			return nil, err
		}
		activities[dayIndex].FieldCount[value] += 1
	}

	for i := 1; i < days; i++ {
		for action, count := range activities[i-1].FieldCount {
			activities[i].FieldCount[action] += count
		}
	}

	return activities, nil
}

func GetRangeActivities(rangeType string, count int, user string, fieldName string) ([]*Activity, error) {
	records, err := GetRecords("casbin")
	if err != nil {
		return nil, err
	}

	now := time.Now()

	var startDateTime time.Time

	switch rangeType {
	case "Hour":
		startDateTime = now.Truncate(time.Hour).Add(-time.Hour * time.Duration(count-1))
	case "Day":
		startDateTime = now.Truncate(24*time.Hour).AddDate(0, 0, -(count - 1))
	case "Week":
		offset := int(time.Monday - now.Weekday())
		if offset > 0 {
			offset -= 7
		}
		startOfWeek := now.AddDate(0, 0, offset)
		startDateTime = startOfWeek.Truncate(24*time.Hour).AddDate(0, 0, -7*(count-1))
	case "Month":
		startDateTime = now.Truncate(24*time.Hour).AddDate(0, -count+1, 0)
	default:
		return nil, fmt.Errorf("invalid range type: %s", rangeType)
	}

	activities := make([]*Activity, count)
	for i := range activities {
		activities[i] = &Activity{FieldCount: make(map[string]int)}
	}

	for _, record := range records {
		if !(user == "All" || record.User == user) {
			continue
		}
		recordTime, _ := time.Parse(time.RFC3339, record.CreatedTime)
		bucketIndex := -1

		switch rangeType {
		case "Hour":
			bucketIndex = int(recordTime.Sub(startDateTime).Hours())
		case "Day":
			bucketIndex = int(recordTime.Sub(startDateTime).Hours() / 24)
		case "Week":
			bucketIndex = int(recordTime.Sub(startDateTime).Hours() / (24 * 7))
		case "Month":
			monthDiff := (recordTime.Year()-startDateTime.Year())*12 + int(recordTime.Month()-startDateTime.Month())
			bucketIndex = monthDiff
		}

		if bucketIndex >= 0 && bucketIndex < count {
			value, err := getTargetfieldValue(record, fieldName)
			if err != nil {
				return nil, err
			}
			activities[bucketIndex].FieldCount[value] += 1
		}
	}

	// Assign dates and refine price for each usage after calculations are complete
	for i, activity := range activities {
		var dateLabel string
		switch rangeType {
		case "Hour":
			dateLabel = startDateTime.Add(time.Hour * time.Duration(i)).Format("2006-01-02 15")
		case "Day":
			dateLabel = startDateTime.AddDate(0, 0, i).Format("2006-01-02")
		case "Week":
			dateLabel = startDateTime.AddDate(0, 0, 7*i).Format("2006-01-02")
		case "Month":
			dateLabel = startDateTime.AddDate(0, i, 0).Format("2006-01")
		}
		activity.Date = dateLabel
	}

	return activities, nil
}
