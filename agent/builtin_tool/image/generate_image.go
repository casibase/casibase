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

package imagetools

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/casibase/casibase/agent/builtin_tool"
	"github.com/casibase/casibase/model"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

type GenerateImageTool struct{}

func (t *GenerateImageTool) GetName() string {
	return "generate_image"
}

func (t *GenerateImageTool) GetDescription() string {
	return "Generate an image based on a text description. Use this tool when the user asks you to create, draw, generate, or visualize an image."
}

func (t *GenerateImageTool) GetInputSchema() interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"prompt": map[string]interface{}{
				"type":        "string",
				"description": "A detailed text description of the image to generate. Be specific and descriptive.",
			},
		},
		"required": []string{"prompt"},
	}
}

func (t *GenerateImageTool) Execute(ctx context.Context, arguments map[string]interface{}) (*protocol.CallToolResult, error) {
	prompt, ok := arguments["prompt"].(string)
	if !ok || prompt == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Error: 'prompt' parameter is required and must be a non-empty string",
				},
			},
		}, nil
	}

	// Get store information from context
	owner, storeName, lang, ok := builtin_tool.GetStoreInfo(ctx)
	if !ok {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Error: Store information not available in context",
				},
			},
		}, nil
	}

	// Get the store object
	storeId := util.GetIdFromOwnerAndName(owner, storeName)
	store, err := object.GetStore(storeId)
	if err != nil || store == nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Error: Failed to get store: %v", err),
				},
			},
		}, nil
	}

	// Find an image generation provider from child model providers
	var imageProviderName string
	for _, providerName := range store.ChildModelProviders {
		provider, err := object.GetProvider(util.GetIdFromOwnerAndName(owner, providerName))
		if err != nil || provider == nil {
			continue
		}
		
		// Check if this is an image generation model
		subType := strings.ToLower(provider.SubType)
		if strings.Contains(subType, "dall-e") || strings.Contains(subType, "gpt-image") || 
		   strings.Contains(subType, "seedream") || strings.Contains(subType, "seededit") || 
		   strings.Contains(subType, "grok-2-image") {
			imageProviderName = providerName
			break
		}
	}

	if imageProviderName == "" {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Error: No image generation provider found. Please configure a DALL-E or other image generation provider in the store's child model providers.",
				},
			},
		}, nil
	}

	// Get the image provider
	_, imageProviderObj, err := object.GetModelProviderFromContext(owner, imageProviderName, lang)
	if err != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Error: Failed to initialize image provider: %v", err),
				},
			},
		}, nil
	}

	// Generate the image using a string buffer to capture output
	var outputBuilder strings.Builder
	writer := io.Writer(&outputBuilder)
	
	modelResult, err := imageProviderObj.QueryText(prompt, writer, nil, "", nil, nil, lang)
	if err != nil {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: fmt.Sprintf("Error generating image: %v", err),
				},
			},
		}, nil
	}

	// Get the generated output (should contain the image HTML)
	output := outputBuilder.String()
	
	// Create result message
	resultText := output
	if resultText == "" {
		resultText = "Image generated successfully"
	}
	
	// Include cost information if available
	if modelResult != nil && modelResult.TotalPrice > 0 {
		resultText += fmt.Sprintf("\n\nCost: %.4f %s", modelResult.TotalPrice, modelResult.Currency)
	}

	return &protocol.CallToolResult{
		IsError: false,
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: resultText,
			},
		},
	}, nil
}
