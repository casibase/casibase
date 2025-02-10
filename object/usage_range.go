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
	"time"

	"github.com/casibase/casibase/model"
)

func GetRangeUsages(rangeType string, count int, user string) ([]*Usage, error) {
	messages, err := GetGlobalMessagesByCreatedTime()
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

	usages := make([]*Usage, count)
	for i := range usages {
		usages[i] = &Usage{}
	}

	// Separate sets for each bucket
	userSets := make([]map[string]struct{}, count)
	chatSets := make([]map[string]struct{}, count)
	for i := range userSets {
		userSets[i] = make(map[string]struct{})
		chatSets[i] = make(map[string]struct{})
	}

	for _, message := range messages {
		if !(user == "All" || message.User == user) {
			continue
		}
		messageTime, _ := time.Parse(time.RFC3339, message.CreatedTime)
		bucketIndex := -1

		switch rangeType {
		case "Hour":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours())
		case "Day":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours() / 24)
		case "Week":
			bucketIndex = int(messageTime.Sub(startDateTime).Hours() / (24 * 7))
		case "Month":
			monthDiff := (messageTime.Year()-startDateTime.Year())*12 + int(messageTime.Month()-startDateTime.Month())
			bucketIndex = monthDiff
		}

		if bucketIndex >= 0 && bucketIndex < count {
			currentUsage := usages[bucketIndex]
			if _, exists := userSets[bucketIndex][message.User]; !exists {
				userSets[bucketIndex][message.User] = struct{}{}
				currentUsage.UserCount = len(userSets[bucketIndex])
			}
			if _, exists := chatSets[bucketIndex][message.Chat]; !exists {
				chatSets[bucketIndex][message.Chat] = struct{}{}
				currentUsage.ChatCount = len(chatSets[bucketIndex])
			}
			currentUsage.MessageCount++
			currentUsage.TokenCount += message.TokenCount
			currentUsage.Price += message.Price
			if currentUsage.Currency == "" {
				currentUsage.Currency = message.Currency
			}
		}
	}

	// Assign dates and refine price for each usage after calculations are complete
	for i, usage := range usages {
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
		usage.Date = dateLabel
		usage.Price = model.RefinePrice(usage.Price)
	}

	return usages, nil
}
