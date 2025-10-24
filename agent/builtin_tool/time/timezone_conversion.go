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

type TimezoneConversionTool struct{}

func (t *TimezoneConversionTool) GetName() string {
	return "timezone_conversion"
}

func (t *TimezoneConversionTool) GetDescription() string {
	return "A tool for converting time between different timezones"
}

func (t *TimezoneConversionTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"datetime": map[string]interface{}{
				"type":        "string",
				"description": "Datetime string (e.g., '2024-01-01 12:00:00')",
			},
			"from_timezone": map[string]interface{}{
				"type":        "string",
				"description": "Source timezone (e.g., 'America/New_York')",
			},
			"to_timezone": map[string]interface{}{
				"type":        "string",
				"description": "Target timezone (e.g., 'Asia/Shanghai')",
			},
		},
		"required": []string{"datetime", "from_timezone", "to_timezone"},
	}
}

func (t *TimezoneConversionTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	datetimeStr, ok := arguments["datetime"].(string)
	if !ok || datetimeStr == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing required parameter: datetime",
				},
			},
		}, nil
	}

	fromTz, ok := arguments["from_timezone"].(string)
	if !ok || fromTz == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing required parameter: from_timezone",
				},
			},
		}, nil
	}

	toTz, ok := arguments["to_timezone"].(string)
	if !ok || toTz == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing required parameter: to_timezone",
				},
			},
		}, nil
	}

	fromLocation, err := time.LoadLocation(fromTz)
	if err != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid source timezone: %s", fromTz),
				},
			},
		}, nil
	}

	toLocation, err := time.LoadLocation(toTz)
	if err != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid target timezone: %s", toTz),
				},
			},
		}, nil
	}

	layouts := []string{
		"2006-01-02 15:04:05",
		"2006-1-2 15:4:5",
		"2006-01-02 15:04",
		"2006-01-02",
	}

	var parsedTime time.Time
	var parseErr error
	for _, layout := range layouts {
		parsedTime, parseErr = time.ParseInLocation(layout, datetimeStr, fromLocation)
		if parseErr == nil {
			break
		}
	}

	if parseErr != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid datetime format: %s. Please use format like '2024-01-01 12:00:00'", datetimeStr),
				},
			},
		}, nil
	}

	convertedTime := parsedTime.In(toLocation)

	result := convertedTime.Format("2006-01-02 15:04:05")

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
