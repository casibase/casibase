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
	"embed"
	"fmt"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"gopkg.in/yaml.v3"
)

//go:embed time/time.yaml code/code.yaml json/json.yaml
var toolsFS embed.FS

type ToolConfig struct {
	Name        string                 `yaml:"name"`
	Description string                 `yaml:"description"`
	InputSchema map[string]interface{} `yaml:"inputSchema"`
}

var availableTools = []string{"time", "code", "json"}

// LoadToolConfig loads a tool configuration from the embedded YAML files
func LoadToolConfig(toolName string) (*ToolConfig, error) {
	var yamlPath string
	switch toolName {
	case "time":
		yamlPath = "time/time.yaml"
	case "code":
		yamlPath = "code/code.yaml"
	case "json":
		yamlPath = "json/json.yaml"
	default:
		return nil, fmt.Errorf("unknown tool: %s", toolName)
	}

	data, err := toolsFS.ReadFile(yamlPath)
	if err != nil {
		return nil, err
	}

	var config ToolConfig
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

// ConvertToProtocolTool converts a ToolConfig to protocol.Tool format
func ConvertToProtocolTool(config *ToolConfig) (*protocol.Tool, error) {
	// Parse the input schema map into protocol.InputSchema structure
	schemaType, ok := config.InputSchema["type"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid or missing 'type' in inputSchema")
	}

	properties := make(map[string]*protocol.Property)
	if propsMap, ok := config.InputSchema["properties"].(map[string]interface{}); ok {
		for propName, propValue := range propsMap {
			propMap, ok := propValue.(map[string]interface{})
			if !ok {
				continue
			}

			prop := &protocol.Property{}
			if propType, ok := propMap["type"].(string); ok {
				prop.Type = protocol.DataType(propType)
			}
			if desc, ok := propMap["description"].(string); ok {
				prop.Description = desc
			}
			// Note: Default values are not directly supported in protocol.Property
			// They would need to be handled at the execution layer

			properties[propName] = prop
		}
	}

	var required []string
	if reqList, ok := config.InputSchema["required"].([]interface{}); ok {
		for _, req := range reqList {
			if reqStr, ok := req.(string); ok {
				required = append(required, reqStr)
			}
		}
	}

	inputSchema := protocol.InputSchema{
		Type:       protocol.InputSchemaType(schemaType),
		Properties: properties,
		Required:   required,
	}

	return &protocol.Tool{
		Name:        config.Name,
		Description: config.Description,
		InputSchema: inputSchema,
	}, nil
}

// GetAvailableTools returns the list of available builtin tools
func GetAvailableTools() []string {
	return availableTools
}

// GetEnabledTools returns protocol.Tool instances for enabled tools
func GetEnabledTools(enabledTools []string) ([]*protocol.Tool, error) {
	var tools []*protocol.Tool
	for _, toolName := range enabledTools {
		config, err := LoadToolConfig(toolName)
		if err != nil {
			return nil, fmt.Errorf("failed to load tool %s: %w", toolName, err)
		}

		tool, err := ConvertToProtocolTool(config)
		if err != nil {
			return nil, fmt.Errorf("failed to convert tool %s: %w", toolName, err)
		}

		tools = append(tools, tool)
	}
	return tools, nil
}
