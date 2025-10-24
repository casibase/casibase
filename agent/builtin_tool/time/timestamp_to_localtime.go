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

type TimestampToLocalTimeTool struct{}

func (t *TimestampToLocalTimeTool) GetName() string {
	return "timestamp_to_localtime"
}

func (t *TimestampToLocalTimeTool) GetDescription() string {
	return "A tool for timestamp convert to localtime"
}

func (t *TimestampToLocalTimeTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"timestamp": map[string]interface{}{
				"type":        "number",
				"description": "Unix timestamp",
			},
			"timezone": map[string]interface{}{
				"type":        "string",
				"description": "Timezone (e.g., 'Asia/Shanghai')",
				"default":     "Asia/Shanghai",
			},
		},
		"required": []string{"timestamp"},
	}
}

func (t *TimestampToLocalTimeTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	var timestamp int64
	switch v := arguments["timestamp"].(type) {
	case float64:
		timestamp = int64(v)
	case int64:
		timestamp = v
	case int:
		timestamp = int64(v)
	default:
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Missing or invalid parameter: timestamp",
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

	localTime := time.Unix(timestamp, 0).In(location)

	result := localTime.Format("2006-01-02 15:04:05")

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
