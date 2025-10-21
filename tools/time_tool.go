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

package tools

import (
	"encoding/json"
	"fmt"
	"time"
)

type TimeToolInput struct {
	Timezone string `json:"timezone"`
	Format   string `json:"format"`
}

// ExecuteTimeTool executes the time tool with the given arguments
func ExecuteTimeTool(arguments string) (string, error) {
	var input TimeToolInput
	err := json.Unmarshal([]byte(arguments), &input)
	if err != nil {
		return "", fmt.Errorf("failed to parse arguments: %w", err)
	}

	// Set defaults
	if input.Timezone == "" {
		input.Timezone = "UTC"
	}
	if input.Format == "" {
		input.Format = "2006-01-02 15:04:05"
	}

	// Load timezone
	loc, err := time.LoadLocation(input.Timezone)
	if err != nil {
		return "", fmt.Errorf("invalid timezone: %w", err)
	}

	// Get current time in specified timezone
	currentTime := time.Now().In(loc)

	// Format the time
	formattedTime := currentTime.Format(input.Format)

	return formattedTime, nil
}
