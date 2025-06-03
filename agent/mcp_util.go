package agent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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

func GetServerNameAndToolNameFromId(id string) (string, string) {
	tokens := strings.Split(id, "__")
	if len(tokens) != 2 {
		panic(errors.New("GetServerNameAndToolNameFromName() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1]
}

func GetIdFromServerNameAndToolName(ServerName, toolName string) string {
	return ServerName + "__" + toolName
}
