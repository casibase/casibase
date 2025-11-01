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

package object

import (
	"encoding/json"
	"testing"

	"github.com/casibase/casibase/util"
)

func TestGraphStructFields(t *testing.T) {
	// Test that the Graph struct can be created with the new fields
	graph := &Graph{
		Owner:       "test-owner",
		Name:        "test-graph",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "Test Graph",
		Category:    "Default",
		Layout:      "force",
		Density:     5,
		Text:        `{"nodes":[],"links":[]}`,
		SaveLayout:  true,
		LayoutData:  `{"node1":{"x":100,"y":200},"node2":{"x":300,"y":400}}`,
	}

	// Verify the new fields are set correctly
	if graph.SaveLayout != true {
		t.Errorf("Expected SaveLayout to be true, got %v", graph.SaveLayout)
	}
	if graph.LayoutData != `{"node1":{"x":100,"y":200},"node2":{"x":300,"y":400}}` {
		t.Errorf("Expected LayoutData to be set, got %v", graph.LayoutData)
	}

	// Test that LayoutData can be parsed as JSON
	var layoutData map[string]interface{}
	err := json.Unmarshal([]byte(graph.LayoutData), &layoutData)
	if err != nil {
		t.Errorf("Failed to parse LayoutData as JSON: %v", err)
	}

	// Verify GetId works
	expectedId := "test-owner/test-graph"
	if graph.GetId() != expectedId {
		t.Errorf("Expected GetId to return %v, got %v", expectedId, graph.GetId())
	}
}

func TestGraphJSONSerialization(t *testing.T) {
	// Create a graph with the new fields
	graph := &Graph{
		Owner:       "test-owner",
		Name:        "test-graph",
		CreatedTime: util.GetCurrentTime(),
		DisplayName: "Test Graph",
		SaveLayout:  true,
		LayoutData:  `{"node1":{"x":100,"y":200}}`,
	}

	// Serialize to JSON
	jsonData, err := json.Marshal(graph)
	if err != nil {
		t.Fatalf("Failed to marshal graph to JSON: %v", err)
	}

	// Deserialize from JSON
	var deserializedGraph Graph
	err = json.Unmarshal(jsonData, &deserializedGraph)
	if err != nil {
		t.Fatalf("Failed to unmarshal graph from JSON: %v", err)
	}

	// Verify the new fields are preserved
	if deserializedGraph.SaveLayout != graph.SaveLayout {
		t.Errorf("Expected SaveLayout to be %v, got %v", graph.SaveLayout, deserializedGraph.SaveLayout)
	}
	if deserializedGraph.LayoutData != graph.LayoutData {
		t.Errorf("Expected LayoutData to be %v, got %v", graph.LayoutData, deserializedGraph.LayoutData)
	}
}
