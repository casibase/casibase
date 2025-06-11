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

package model

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/ThinkInAIXYZ/go-mcp/client"
	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/casibase/casibase/agent"
	"github.com/sashabaranov/go-openai"
)

type AgentMessages struct {
	Messages  []*RawMessage
	ToolCalls any
}

type AgentInfo struct {
	AgentClients  *agent.AgentClients
	AgentMessages *AgentMessages
}

type ToolCallResponse struct {
	Success  bool        `json:"success"`
	Data     interface{} `json:"data"`
	Error    string      `json:"error,omitempty"`
	ToolName string      `json:"toolName"`
}

func reverseToolsToOpenAi(tools []*protocol.Tool) ([]openai.Tool, error) {
	var openaiTools []openai.Tool
	for _, tool := range tools {
		schemaBytes, err := json.Marshal(tool.InputSchema)
		if err != nil {
			return nil, err
		}

		var parameters map[string]interface{}
		if err := json.Unmarshal(schemaBytes, &parameters); err != nil {
			return nil, err
		}
		openaiTools = append(openaiTools, openai.Tool{
			Type: "function",
			Function: &openai.FunctionDefinition{
				Name:        tool.Name,
				Description: tool.Description,
				Parameters:  parameters,
			},
		})
	}
	return openaiTools, nil
}

func handleToolCalls(toolCalls []openai.ToolCall, flushData interface{}, writer io.Writer) error {
	if toolCalls == nil {
		return nil
	}

	if flushThink, ok := flushData.(func(string, string, io.Writer) error); ok {
		for _, toolCall := range toolCalls {
			err := flushThink("\n"+"Call result from "+toolCall.Function.Name+"\n", "reason", writer)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func handleToolCallsParameters(toolCall openai.ToolCall, toolCalls []openai.ToolCall, toolCallsMap map[int]int) ([]openai.ToolCall, map[int]int) {
	if toolCallsMap == nil {
		toolCallsMap = make(map[int]int)
	}

	idx := *toolCall.Index
	if existingIdx, exists := toolCallsMap[idx]; exists {
		if toolCall.Function.Name != "" {
			toolCalls[existingIdx].Function.Name = toolCall.Function.Name
		}
		if toolCall.Function.Arguments != "" {
			toolCalls[existingIdx].Function.Arguments += toolCall.Function.Arguments
		}
	} else {
		newIdx := len(toolCalls)
		toolCallsMap[idx] = newIdx
		toolCalls = append(toolCalls, toolCall)
	}
	return toolCalls, toolCallsMap
}

func QueryTextWithTools(p ModelProvider, question string, writer io.Writer, history []*RawMessage, prompt string, knowledgeMessages []*RawMessage, agentInfo *AgentInfo) (*ModelResult, error) {
	var messages []*RawMessage
	modelResult, err := p.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo)
	if err != nil {
		return nil, err
	}

	if agentInfo.AgentMessages.ToolCalls == nil {
		return modelResult, nil
	}

	toolCalls := agentInfo.AgentMessages.ToolCalls.([]openai.ToolCall)

	for len(toolCalls) > 0 {
		for _, toolCall := range toolCalls {
			serverName, toolName := agent.GetServerNameAndToolNameFromId(toolCall.Function.Name)

			mcpClient, ok := agentInfo.AgentClients.Clients[serverName]
			if !ok {
				continue
			}

			messages = append(messages, &RawMessage{
				Text:      "Call result from " + toolCall.Function.Name,
				Author:    "AI",
				ToolCalls: []openai.ToolCall{toolCall},
			})

			messages, err = callTools(toolCall, toolName, mcpClient, messages)
			if err != nil {
				return nil, err
			}
		}
		agentInfo.AgentMessages.Messages = messages
		modelResult, err = p.QueryText(question, writer, history, prompt, knowledgeMessages, agentInfo)
		if err != nil {
			return nil, err
		}
		toolCalls = agentInfo.AgentMessages.ToolCalls.([]openai.ToolCall)
	}

	for _, mcpClient := range agentInfo.AgentClients.Clients {
		mcpClient.Close()
	}
	return modelResult, nil
}

func createToolMessage(toolCall openai.ToolCall, text string) *RawMessage {
	return &RawMessage{
		Text:       text,
		Author:     "Tool",
		ToolCallID: toolCall.ID,
	}
}

func callTools(toolCall openai.ToolCall, functionName string, mcpClient *client.Client, messages []*RawMessage) ([]*RawMessage, error) {
	var arguments map[string]interface{}
	ctx := context.Background()

	if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &arguments); err != nil {
		return nil, fmt.Errorf("failed to parse tool arguments: %v", err)
	}

	req := &protocol.CallToolRequest{
		Name:      functionName,
		Arguments: arguments,
	}

	result, err := mcpClient.CallTool(ctx, req)
	response := &ToolCallResponse{
		ToolName: toolCall.Function.Name,
	}

	if err != nil {
		response.Success = false
		response.Error = err.Error()
	} else if result.IsError {
		response.Success = false
		response.Error = fmt.Sprintf("%v", result.Content)
	} else {
		response.Success = true
		response.Data = result.Content
	}

	responseJson, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal tool response: %v", err)
	}

	messages = append(messages, createToolMessage(toolCall, string(responseJson)))
	return messages, nil
}
