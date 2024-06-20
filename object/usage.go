// Copyright 2024 The casbin Authors. All Rights Reserved.
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

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor-go-sdk/casdoorsdk"
	"github.com/casibase/casibase/model"
)

type Usage struct {
	Date         string  `json:"date"`
	UserCount    int     `json:"userCount"`
	ChatCount    int     `json:"chatCount"`
	MessageCount int     `json:"messageCount"`
	TokenCount   int     `json:"tokenCount"`
	Price        float64 `json:"price"`
	Currency     string  `json:"currency"`
}

type UsageUser struct {
	User string `json:"user"`
}

type UsageMetadata struct {
	Organization string `json:"organization"`
	Application  string `json:"application"`
}

func GetUsages(days int, user string) ([]*Usage, error) {
	var messages []*Message
	var err error
	if user == "All" {
		messages, err = GetGlobalMessagesByCreatedTime()
	} else {
		messages, err = GetGlobalMessagesByUser(user)
	}
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	// Adjusted to include today in the count by subtracting days-1
	startDateTime := now.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)

	// Adjusted the size to days, as we're now including today
	usages := make([]*Usage, days)
	userSet := make(map[string]int)
	chatSet := make(map[string]int)

	for i := 0; i < days; i++ {
		usages[i] = &Usage{
			Date: startDateTime.AddDate(0, 0, i).Format("2006-01-02"),
		}
	}

	var currentUsage *Usage
	dayIndex := 0
	if len(usages) > 0 {
		currentUsage = usages[0]
	}

	for _, message := range messages {
		messageTime, _ := time.Parse(time.RFC3339, message.CreatedTime)
		// Find the date index for the message
		for dayIndex < days && !messageTime.Before(startDateTime.AddDate(0, 0, dayIndex+1)) {
			dayIndex++
			if dayIndex < days {
				currentUsage = usages[dayIndex]
				// Inherit the statistical data from the previous day
				if dayIndex > 0 {
					previousUsage := usages[dayIndex-1]
					currentUsage.UserCount = previousUsage.UserCount
					currentUsage.ChatCount = previousUsage.ChatCount
					currentUsage.MessageCount = previousUsage.MessageCount
					currentUsage.TokenCount = previousUsage.TokenCount
					currentUsage.Price = previousUsage.Price
					currentUsage.Currency = previousUsage.Currency
				}
			}
		}

		// If the current message is within the statistical range
		if dayIndex < days {
			userSet[message.User] = 1
			chatSet[message.Chat] = 1
			currentUsage.UserCount = len(userSet)
			currentUsage.ChatCount = len(chatSet)
			currentUsage.MessageCount++
			currentUsage.TokenCount += message.TokenCount
			currentUsage.Price += message.Price
			currentUsage.Currency = message.Currency
		}
	}

	// Update remaining days with the last known data, if necessary
	for i := dayIndex + 1; i < days; i++ {
		currentUsage = usages[i]
		previousUsage := usages[i-1]
		// Inherit the statistical data from the previous day
		currentUsage.UserCount = previousUsage.UserCount
		currentUsage.ChatCount = previousUsage.ChatCount
		currentUsage.MessageCount = previousUsage.MessageCount
		currentUsage.TokenCount = previousUsage.TokenCount
		currentUsage.Price = previousUsage.Price
		currentUsage.Currency = previousUsage.Currency
	}

	for _, usage := range usages {
		usage.Price = model.RefinePrice(usage.Price)
	}

	return usages, nil
}

func GetUsage(date string) (*Usage, error) {
	messages, err := GetGlobalMessages()
	if err != nil {
		return nil, err
	}

	userSet := make(map[string]int)
	chatSet := make(map[string]int)
	var messageCount, tokenCount int
	price := 0.0

	var dateTime time.Time
	if date != "" {
		dateTime, err = time.Parse("2006-01-02", date)
		if err != nil {
			return nil, err
		}
	}

	for _, message := range messages {
		var createdTime time.Time
		createdTime, err = time.Parse(time.RFC3339, message.CreatedTime)
		if err != nil {
			return nil, err
		}

		if date == "" || createdTime.Before(dateTime.AddDate(0, 0, 1)) {
			// Adding user to userSet for distinct user count
			if _, exists := userSet[message.User]; !exists {
				userSet[message.User] = 1
			}
			// Adding chat to chatSet for distinct chat count
			if _, exists := chatSet[message.Chat]; !exists {
				chatSet[message.Chat] = 1
			}
			messageCount++
			tokenCount += message.TokenCount
			price += message.Price
		}
	}

	currency := "USD"
	if len(messages) > 0 && messages[0].Currency != "" {
		currency = messages[0].Currency
	}

	price = model.RefinePrice(price)

	usage := &Usage{
		Date:         date,
		UserCount:    len(userSet),
		ChatCount:    len(chatSet),
		MessageCount: messageCount,
		TokenCount:   tokenCount,
		Price:        price,
		Currency:     currency,
	}
	return usage, nil
}

func GetUsageUser() ([]*UsageUser, error) {
	messages, err := GetGlobalMessages()
	if err != nil {
		return nil, err
	}
	allUser := make([]*UsageUser, 0)
	userSet := make(map[string]int)
	for _, message := range messages {
		if _, exists := userSet[message.User]; !exists {
			userSet[message.User] = 1
			allUser = append(allUser, &UsageUser{User: message.User})
		}
	}
	return allUser, nil
}

func GetUsageMetadata() (*UsageMetadata, error) {
	casdoorOrganization := beego.AppConfig.String("casdoorOrganization")
	organization, err := casdoorsdk.GetOrganization(casdoorOrganization)
	if err != nil {
		return nil, err
	}
	if organization == nil {
		return nil, fmt.Errorf("Casdoor organization: [%s] doesn't exist", casdoorOrganization)
	}

	casdoorApplication := beego.AppConfig.String("casdoorApplication")
	application, err := casdoorsdk.GetApplication(casdoorApplication)
	if err != nil {
		return nil, err
	}
	if application == nil {
		return nil, fmt.Errorf("Casdoor application: [%s] doesn't exist", casdoorApplication)
	}

	res := &UsageMetadata{
		Organization: organization.DisplayName,
		Application:  application.DisplayName,
	}
	return res, nil
}
