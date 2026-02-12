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
	"strings"

	"github.com/ThinkInAIXYZ/go-mcp/protocol"
	"github.com/casibase/casibase/agent/toolcontext"
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

	// Get language from context
	_, _, lang, ok := toolcontext.GetStoreInfo(ctx)
	if !ok {
		lang = "en" // default to English
	}

	// Get the image generator function from context
	generator, ok := toolcontext.GetImageGenerator(ctx)
	if !ok {
		return &protocol.CallToolResult{
			IsError: true,
			Content: []protocol.Content{
				&protocol.TextContent{
					Type: "text",
					Text: "Error: Image generation is not available. Please ensure an image generation provider (like DALL-E) is configured in the store's child model providers.",
				},
			},
		}, nil
	}

	// Generate the image using the callback
	output, err := generator(prompt, &outputBuilder, lang)
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

	// Use output from generator, fallback to builder output, or use default message
	if output == "" {
		output = outputBuilder.String()
		if output == "" {
			output = "Image generated successfully"
		}
	}

	return &protocol.CallToolResult{
		IsError: false,
		Content: []protocol.Content{
			&protocol.TextContent{
				Type: "text",
				Text: output,
			},
		},
	}, nil
}
