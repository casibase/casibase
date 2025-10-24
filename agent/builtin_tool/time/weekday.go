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

package timetools

import (
	"context"
	"fmt"
	"time"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
)

type WeekdayTool struct{}

func (t *WeekdayTool) GetName() string {
	return "weekday"
}

func (t *WeekdayTool) GetDescription() string {
	return "A tool for calculating the weekday of a given date by year, month and day."
}

func (t *WeekdayTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"year": map[string]interface{}{
				"type":        "number",
				"description": "Year (e.g., 2024)",
			},
			"month": map[string]interface{}{
				"type":        "number",
				"description": "Month (1-12)",
			},
			"day": map[string]interface{}{
				"type":        "number",
				"description": "Day of month (1-31)",
			},
		},
		"required": []string{"year", "month", "day"},
	}
}

func (t *WeekdayTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	var year int
	switch v := arguments["year"].(type) {
	case float64:
		year = int(v)
	case int:
		year = v
	default:
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing or invalid parameter: year",
				},
			},
		}, nil
	}

	var month int
	switch v := arguments["month"].(type) {
	case float64:
		month = int(v)
	case int:
		month = v
	default:
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing or invalid parameter: month",
				},
			},
		}, nil
	}

	var day int
	switch v := arguments["day"].(type) {
	case float64:
		day = int(v)
	case int:
		day = v
	default:
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing or invalid parameter: day",
				},
			},
		}, nil
	}

	if month < 1 || month > 12 {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid month: %d. Month must be between 1 and 12", month),
				},
			},
		}, nil
	}

	if day < 1 || day > 31 {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid day: %d. Day must be between 1 and 31", day),
				},
			},
		}, nil
	}

	date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)

	weekday := date.Weekday().String()

	monthName := date.Month().String()
	readableDate := fmt.Sprintf("%s %d, %d", monthName, date.Day(), date.Year())
	result := fmt.Sprintf("%s is %s.", readableDate, weekday)

	return &protocol.CallToolResult{
		IsError: false,
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: result,
			},
		},
	}, nil
}
