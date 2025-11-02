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

//go:build !skipCi
// +build !skipCi

package scan

import (
	"encoding/json"
	"runtime"
	"testing"
)

func TestNewOSPatchScanProvider(t *testing.T) {
	provider, err := NewOSPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OS Patch scan provider: %v", err)
	}

	if provider == nil {
		t.Fatal("Expected provider to be non-nil")
	}
}

func TestOSPatchScan(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	provider, err := NewOSPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OS Patch scan provider: %v", err)
	}

	// Test scanning with a target (target is used for reference only)
	result, err := provider.Scan("localhost")
	if err != nil {
		t.Fatalf("Failed to scan: %v", err)
	}

	if result == "" {
		t.Fatal("Expected non-empty scan result")
	}

	// Verify the result is valid JSON
	var resultMap map[string]interface{}
	err = json.Unmarshal([]byte(result), &resultMap)
	if err != nil {
		t.Fatalf("Failed to parse scan result as JSON: %v", err)
	}

	// Verify expected fields are present
	if _, ok := resultMap["hostname"]; !ok {
		t.Error("Expected 'hostname' field in result")
	}
	if _, ok := resultMap["patchCount"]; !ok {
		t.Error("Expected 'patchCount' field in result")
	}
	if _, ok := resultMap["patches"]; !ok {
		t.Error("Expected 'patches' field in result")
	}
	if _, ok := resultMap["scanType"]; !ok {
		t.Error("Expected 'scanType' field in result")
	}

	t.Logf("Scan result: %s", result)
}

func TestOSPatchScanWithCommand(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	provider, err := NewOSPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OS Patch scan provider: %v", err)
	}

	// Test that ScanWithCommand works (command is ignored)
	result1, err := provider.Scan("localhost")
	if err != nil {
		t.Fatalf("Failed to scan: %v", err)
	}

	result2, err := provider.ScanWithCommand("localhost", "some-command")
	if err != nil {
		t.Fatalf("Failed to scan with command: %v", err)
	}

	// Both should return valid JSON
	var resultMap1, resultMap2 map[string]interface{}
	err = json.Unmarshal([]byte(result1), &resultMap1)
	if err != nil {
		t.Fatalf("Failed to parse scan result as JSON: %v", err)
	}

	err = json.Unmarshal([]byte(result2), &resultMap2)
	if err != nil {
		t.Fatalf("Failed to parse scan with command result as JSON: %v", err)
	}

	t.Logf("Scan result: %s", result1)
	t.Logf("Scan with command result: %s", result2)
}
