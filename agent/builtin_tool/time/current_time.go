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

type CurrentTimeTool struct{}

func (t *CurrentTimeTool) GetName() string {
	return "current_time"
}

func (t *CurrentTimeTool) GetDescription() string {
	return "Get the current date and time. Returns the current date and time in the specified timezone."
}

func (t *CurrentTimeTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"timezone": map[string]interface{}{
				"type":        "string",
				"description": "Optional. Timezone name (e.g., 'UTC', 'America/New_York', 'Asia/Shanghai'). Defaults to UTC.",
			},
		},
		"required": []string{},
	}
}

func (t *CurrentTimeTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	tzName := "UTC"
	if tz, ok := arguments["timezone"].(string); ok && tz != "" {
		tzName = tz
	}

	var now time.Time
	if tzName == "UTC" {
		now = time.Now().UTC()
	} else {
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
		now = time.Now().In(location)
	}

	weekday := now.Weekday().String()
	timeStr := fmt.Sprintf("%s %s %s", now.Format("2006-01-02 15:04:05"), weekday, now.Format("MST"))

	return &protocol.CallToolResult{
		IsError: false,
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: timeStr,
			},
		},
	}, nil
}
