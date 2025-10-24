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

type LocalTimeToTimestampTool struct{}

func (t *LocalTimeToTimestampTool) GetName() string {
	return "localtime_to_timestamp"
}

func (t *LocalTimeToTimestampTool) GetDescription() string {
	return "A tool for localtime convert to timestamp"
}

func (t *LocalTimeToTimestampTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"localtime": map[string]interface{}{
				"type":        "string",
				"description": "Local time string (e.g., '2024-01-01 00:00:00')",
			},
			"timezone": map[string]interface{}{
				"type":        "string",
				"description": "Timezone (e.g., 'Asia/Shanghai')",
				"default":     "Asia/Shanghai",
			},
		},
		"required": []string{"localtime"},
	}
}

func (t *LocalTimeToTimestampTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	localtimeStr, ok := arguments["localtime"].(string)
	if !ok || localtimeStr == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing required parameter: localtime",
				},
			},
		}, nil
	}

	tzName := "Asia/Shanghai"
	if tz, ok := arguments["timezone"].(string); ok && tz != "" {
		tzName = tz
	}

	location, err := time.LoadLocation(tzName)
	if err != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Invalid timezone: %s", tzName),
				},
			},
		}, nil
	}

	layouts := []string{
		"2006-1-2 15:4:5",
		"2006-01-02 15:04:05",
		"2006-1-2 15:04:05",
		"2006-01-02 15:4:5",
		"2006-1-2",
		"2006-01-02",
	}

	var parsedTime time.Time
	var parseErr error
	for _, layout := range layouts {
		parsedTime, parseErr = time.ParseInLocation(layout, localtimeStr, location)
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
					Text: fmt.Sprintf("Invalid time format: %s. Please use format like '2024-1-1 0:0:0'", localtimeStr),
				},
			},
		}, nil
	}

	timestamp := parsedTime.Unix()

	return &protocol.CallToolResult{
		IsError: false,
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: fmt.Sprintf("%d", timestamp),
			},
		},
	}, nil
}
