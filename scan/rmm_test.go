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

package scan

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewRmmScanProvider(t *testing.T) {
	tests := []struct {
		name      string
		baseURL   string
		wantError bool
	}{
		{
			name:      "valid URL with http",
			baseURL:   "http://localhost:8080",
			wantError: false,
		},
		{
			name:      "valid URL with https",
			baseURL:   "https://example.com",
			wantError: false,
		},
		{
			name:      "URL without protocol",
			baseURL:   "localhost:8080",
			wantError: false,
		},
		{
			name:      "empty URL",
			baseURL:   "",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider, err := NewRmmScanProvider(tt.baseURL)
			if tt.wantError {
				if err == nil {
					t.Errorf("NewRmmScanProvider() expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("NewRmmScanProvider() unexpected error: %v", err)
				}
				if provider == nil {
					t.Errorf("NewRmmScanProvider() returned nil provider")
				}
			}
		})
	}
}

func TestRmmScanProvider_GetUpdateList(t *testing.T) {
	// Create mock server
	mockResponse := RmmUpdateResponse{
		Count: 2,
		Updates: []RmmUpdateInfo{
			{
				UpdateID:    "KB123456",
				Title:       "Security Update for Windows",
				Description: "Important security patch",
				Installed:   false,
				Severity:    "Critical",
			},
			{
				UpdateID:    "KB789012",
				Title:       "Feature Update",
				Description: "New features",
				Installed:   true,
				Severity:    "Moderate",
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/updates" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(mockResponse)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL)
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	result, err := provider.Scan("")
	if err != nil {
		t.Fatalf("Scan() error: %v", err)
	}

	if result == "" {
		t.Error("Scan() returned empty result")
	}

	// Check if result contains expected information
	if !contains(result, "KB123456") {
		t.Error("Result doesn't contain expected update ID KB123456")
	}
	if !contains(result, "Security Update for Windows") {
		t.Error("Result doesn't contain expected update title")
	}
	if !contains(result, "Critical") {
		t.Error("Result doesn't contain expected severity")
	}
}

func TestRmmScanProvider_InstallUpdate(t *testing.T) {
	updateID := "KB123456"

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/updates/"+updateID+"/install" && r.Method == "POST" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status": "success", "message": "Update installation started"}`))
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL)
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	result, err := provider.ScanWithCommand(updateID, "install")
	if err != nil {
		t.Fatalf("ScanWithCommand() error: %v", err)
	}

	if result == "" {
		t.Error("ScanWithCommand() returned empty result")
	}

	if !contains(result, updateID) {
		t.Error("Result doesn't contain update ID")
	}
}

func TestRmmScanProvider_ScanWithCommand(t *testing.T) {
	tests := []struct {
		name      string
		command   string
		target    string
		wantError bool
	}{
		{
			name:      "list command",
			command:   "list",
			target:    "",
			wantError: false,
		},
		{
			name:      "get-updates command",
			command:   "get-updates",
			target:    "",
			wantError: false,
		},
		{
			name:      "empty command (default)",
			command:   "",
			target:    "",
			wantError: false,
		},
		{
			name:      "install without target",
			command:   "install",
			target:    "",
			wantError: true,
		},
	}

	mockResponse := RmmUpdateResponse{
		Count:   0,
		Updates: []RmmUpdateInfo{},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL)
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := provider.ScanWithCommand(tt.target, tt.command)
			if tt.wantError {
				if err == nil {
					t.Errorf("ScanWithCommand() expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("ScanWithCommand() unexpected error: %v", err)
				}
			}
		})
	}
}

func TestGetScanProvider_RMM(t *testing.T) {
	provider, err := GetScanProvider("RMM", "http://localhost:8080", "en")
	if err != nil {
		t.Fatalf("GetScanProvider() error: %v", err)
	}

	if provider == nil {
		t.Error("GetScanProvider() returned nil provider")
	}

	// Verify it's the correct type
	_, ok := provider.(*RmmScanProvider)
	if !ok {
		t.Error("GetScanProvider() didn't return RmmScanProvider type")
	}
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
