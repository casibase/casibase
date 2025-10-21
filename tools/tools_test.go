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
	"strings"
	"testing"
)

func TestExecuteTimeTool(t *testing.T) {
	// Test with default values
	result, err := ExecuteTimeTool(`{"timezone":"UTC","format":"2006-01-02 15:04:05"}`)
	if err != nil {
		t.Errorf("ExecuteTimeTool failed: %v", err)
	}
	if result == "" {
		t.Error("ExecuteTimeTool returned empty result")
	}
	// Result should look like "2025-10-21 12:34:56"
	if len(strings.Split(result, " ")) != 2 {
		t.Errorf("ExecuteTimeTool returned unexpected format: %s", result)
	}
}

func TestExecuteTimeToolWithTimezone(t *testing.T) {
	// Test with Asia/Shanghai timezone
	result, err := ExecuteTimeTool(`{"timezone":"Asia/Shanghai","format":"2006-01-02"}`)
	if err != nil {
		t.Errorf("ExecuteTimeTool with timezone failed: %v", err)
	}
	if result == "" {
		t.Error("ExecuteTimeTool returned empty result")
	}
	// Result should look like "2025-10-21"
	if len(result) < 8 {
		t.Errorf("ExecuteTimeTool returned unexpected format: %s", result)
	}
}

func TestLoadToolConfig(t *testing.T) {
	config, err := LoadToolConfig("time")
	if err != nil {
		t.Errorf("LoadToolConfig failed: %v", err)
	}
	if config.Name != "current_time" {
		t.Errorf("Expected tool name 'current_time', got '%s'", config.Name)
	}
	if config.Description == "" {
		t.Error("Tool description should not be empty")
	}
}

func TestGetEnabledTools(t *testing.T) {
	tools, err := GetEnabledTools([]string{"time"})
	if err != nil {
		t.Errorf("GetEnabledTools failed: %v", err)
	}
	if len(tools) != 1 {
		t.Errorf("Expected 1 tool, got %d", len(tools))
	}
	if tools[0].Name != "current_time" {
		t.Errorf("Expected tool name 'current_time', got '%s'", tools[0].Name)
	}
}

func TestExecuteBuiltinTool(t *testing.T) {
	// Test time tool
	result, err := ExecuteBuiltinTool("current_time", `{"timezone":"UTC"}`)
	if err != nil {
		t.Errorf("ExecuteBuiltinTool for time failed: %v", err)
	}
	if result == "" {
		t.Error("ExecuteBuiltinTool returned empty result")
	}

	// Test placeholder tools
	_, err = ExecuteBuiltinTool("execute_code", `{}`)
	if err == nil {
		t.Error("ExecuteBuiltinTool for code should return error (not implemented)")
	}

	_, err = ExecuteBuiltinTool("process_json", `{}`)
	if err == nil {
		t.Error("ExecuteBuiltinTool for json should return error (not implemented)")
	}
}
