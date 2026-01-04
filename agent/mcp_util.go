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

package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ThinkInAIXYZ/go-mcp/client"
	"github.com/ThinkInAIXYZ/go-mcp/transport"
)

type ServerConfig struct {
	// Stdio config
	Command string            `json:"command"`
	Args    []string          `json:"args"`
	Env     map[string]string `json:"env"`

	// SSE config
	URL string `json:"url"`

	// Transport type: "sse", "stdio", "streamablehttp"
	// If not specified, auto-detected based on URL field:
	// - URL not empty -> SSE
	// - URL empty -> Stdio
	Type string `json:"type,omitempty"`
}

type McpTools struct {
	ServerName string `json:"serverName"`
	Tools      string `json:"tools"`
	IsEnabled  bool   `json:"isEnabled"`
}

func GetToolsList(config string) ([]*McpTools, error) {
	clients, err := GetMCPClientMap(config, nil)
	if err != nil {
		return nil, err
	}

	var totalTools []*McpTools
	for name, cli := range clients {
		defer cli.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		list, err := cli.ListTools(ctx)
		if err != nil {
			return nil, err
		}

		toolsJson, err := json.Marshal(list.Tools)
		if err != nil {
			return nil, err
		}
		totalTools = append(totalTools, &McpTools{
			ServerName: name,
			Tools:      string(toolsJson),
			IsEnabled:  true,
		})
	}

	return totalTools, nil
}

func createMCPClient(srv ServerConfig) (*client.Client, error) {
	var transportClient transport.ClientTransport
	var err error

	// Determine transport type
	transportType := srv.Type
	if transportType == "" {
		// Auto-detect based on URL field for backward compatibility
		if srv.URL != "" {
			transportType = "sse"
		} else {
			transportType = "stdio"
		}
	}

	// Create appropriate transport
	switch transportType {
	case "sse":
		if srv.URL == "" {
			return nil, fmt.Errorf("URL is required for SSE transport")
		}
		transportClient, err = transport.NewSSEClientTransport(srv.URL)
	case "streamablehttp":
		if srv.URL == "" {
			return nil, fmt.Errorf("URL is required for StreamableHTTP transport")
		}
		transportClient, err = transport.NewStreamableHTTPClientTransport(srv.URL)
	case "stdio":
		envs := make([]string, 0, len(srv.Env))
		for k, v := range srv.Env {
			envs = append(envs, fmt.Sprintf("%s=%s", k, v))
		}
		transportClient, err = transport.NewStdioClientTransport(
			srv.Command,
			srv.Args,
			transport.WithStdioClientOptionEnv(envs...),
		)
	default:
		return nil, fmt.Errorf("unsupported transport type: %s", transportType)
	}

	if err != nil {
		return nil, err
	}

	cli, err := client.NewClient(transportClient)
	if err != nil {
		return nil, err
	}

	return cli, nil
}

func GetMCPClientMap(config string, toolsMap map[string]bool) (map[string]*client.Client, error) {
	var outer struct {
		MCPServers map[string]ServerConfig `json:"mcpServers"`
	}
	if err := json.Unmarshal([]byte(config), &outer); err != nil {
		return nil, err
	}

	clients := make(map[string]*client.Client)
	for name, srv := range outer.MCPServers {
		if toolsMap != nil {
			if enabled, exists := toolsMap[name]; !exists || !enabled {
				continue
			}
		}

		cli, err := createMCPClient(srv)
		if err != nil {
			for _, c := range clients {
				c.Close()
			}
			return nil, err
		}
		clients[name] = cli
	}

	return clients, nil
}
