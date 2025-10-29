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
	"errors"
	"strings"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/casibase/casibase/agent/builtin_tool"
)

func GetServerNameAndToolNameFromId(id string) (string, string) {
	tokens := strings.Split(id, "__")

	if len(tokens) == 1 {
		return "", tokens[0]
	}

	if len(tokens) > 2 {
		panic(errors.New("GetServerNameAndToolNameFromName() error, wrong token count for ID: " + id))
	}

	return tokens[0], tokens[1]
}

func GetIdFromServerNameAndToolName(ServerName, toolName string) string {
	return ServerName + "__" + toolName
}

func MergeBuiltinTools(agentClients *AgentClients, selectedTools []string) *AgentClients {
	if len(selectedTools) == 0 {
		return agentClients
	}

	builtinToolReg := builtin_tool.NewToolRegistry()
	allBuiltinTools := builtinToolReg.GetToolsAsProtocolTools()

	toolMap := make(map[string]*protocol.Tool, len(allBuiltinTools))
	for _, tool := range allBuiltinTools {
		toolMap[tool.Name] = tool
	}

	selectedBuiltinTools := make([]*protocol.Tool, 0, len(selectedTools))
	for _, selectedName := range selectedTools {
		if tool, ok := toolMap[selectedName]; ok {
			selectedBuiltinTools = append(selectedBuiltinTools, tool)
		}
	}

	if len(selectedBuiltinTools) == 0 {
		return agentClients
	}

	if agentClients == nil {
		return &AgentClients{
			Tools:          selectedBuiltinTools,
			BuiltinToolReg: builtinToolReg,
		}
	}

	agentClients.Tools = append(agentClients.Tools, selectedBuiltinTools...)
	agentClients.BuiltinToolReg = builtinToolReg
	return agentClients
}
