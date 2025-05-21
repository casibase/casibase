package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ThinkInAIXYZ/go-mcp/client"
	"github.com/ThinkInAIXYZ/go-mcp/transport"
	"github.com/sashabaranov/go-openai"
)

type ServerConfig struct {
	// Stdio config
	Command string            `json:"command"`
	Args    []string          `json:"args"`
	Env     map[string]string `json:"env"`

	// SSE config
	URL string `json:"url"`
}

type McpTools struct {
	ServerName string `json:"serverName"`
	Tools      string `json:"tools"`
	IsEnabled  bool   `json:"isEnabled"`
}

func GetToolsList(config string) ([]*McpTools, error) {
	clients, err := GetMCPClientList(config)
	if err != nil {
		return nil, err
	}

	var totalTools []*McpTools
	for name, cli := range clients {
		var tools []openai.Tool
		defer cli.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		list, err := cli.ListTools(ctx)
		if err != nil {
			return nil, err
		}

		for _, tool := range list.Tools {
			schemaBytes, err := json.Marshal(tool.InputSchema)
			if err != nil {
				return nil, err
			}

			var parameters map[string]interface{}
			if err := json.Unmarshal(schemaBytes, &parameters); err != nil {
				return nil, err
			}
			tools = append(tools, openai.Tool{
				Type: "function",
				Function: &openai.FunctionDefinition{
					Name:        tool.Name,
					Description: tool.Description,
					Parameters:  parameters,
				},
			})
		}
		toolsJson, err := json.Marshal(tools)
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

	if srv.URL != "" {
		transportClient, err = transport.NewSSEClientTransport(srv.URL)
	} else {
		envs := make([]string, 0, len(srv.Env))
		for k, v := range srv.Env {
			envs = append(envs, fmt.Sprintf("%s=%s", k, v))
		}
		transportClient, err = transport.NewStdioClientTransport(
			srv.Command,
			srv.Args,
			transport.WithStdioClientOptionEnv(envs...),
		)
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

func GetMCPClientList(config string) (map[string]*client.Client, error) {
	var outer struct {
		MCPServers map[string]ServerConfig `json:"mcpServers"`
	}
	if err := json.Unmarshal([]byte(config), &outer); err != nil {
		return nil, err
	}

	clients := make(map[string]*client.Client)
	for name, srv := range outer.MCPServers {
		cli, err := createMCPClient(srv)
		if err != nil {
			return nil, err
		}
		clients[name] = cli
	}

	return clients, nil
}
