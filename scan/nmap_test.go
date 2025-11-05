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
	"testing"
)

// TestIsNmapAvailable tests the IsNmapAvailable function
func TestIsNmapAvailable(t *testing.T) {
	// Test with empty clientId - should check system PATH
	available := IsNmapAvailable("")
	t.Logf("Nmap available in system PATH: %v", available)

	// Test with a non-empty clientId - should always return true
	available = IsNmapAvailable("/usr/bin/nmap")
	if !available {
		t.Error("Expected IsNmapAvailable to return true when clientId is provided")
	}

	// Test with another non-empty clientId
	available = IsNmapAvailable("/custom/path/to/nmap")
	if !available {
		t.Error("Expected IsNmapAvailable to return true when clientId is provided")
	}
}

// TestNewNmapScanProvider tests creating a new NmapScanProvider
func TestNewNmapScanProvider(t *testing.T) {
	// Test with a custom path
	provider, err := NewNmapScanProvider("/usr/bin/nmap")
	if err != nil {
		t.Fatalf("Failed to create NmapScanProvider with custom path: %v", err)
	}
	if provider.nmapPath != "/usr/bin/nmap" {
		t.Errorf("Expected nmapPath to be /usr/bin/nmap, got %s", provider.nmapPath)
	}

	// Test with empty clientId - will only succeed if nmap is in PATH
	provider, err = NewNmapScanProvider("")
	if err != nil {
		// This is expected if nmap is not installed
		t.Logf("Expected error when nmap is not in PATH: %v", err)
	} else {
		t.Logf("Successfully created NmapScanProvider with system nmap at: %s", provider.nmapPath)
	}
}
