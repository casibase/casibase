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
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNewRmmScanProvider(t *testing.T) {
	tests := []struct {
		name         string
		clientId     string
		clientSecret string
		wantErr      bool
		errContains  string
	}{
		{
			name:         "valid configuration",
			clientId:     "http://localhost:8000",
			clientSecret: "test-api-key",
			wantErr:      false,
		},
		{
			name:         "empty client ID",
			clientId:     "",
			clientSecret: "test-api-key",
			wantErr:      true,
			errContains:  "cannot be empty",
		},
		{
			name:         "invalid URL",
			clientId:     "not-a-url",
			clientSecret: "test-api-key",
			wantErr:      true,
			errContains:  "invalid",
		},
		{
			name:         "valid without API key",
			clientId:     "http://localhost:8000",
			clientSecret: "",
			wantErr:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider, err := NewRmmScanProvider(tt.clientId, tt.clientSecret)
			if tt.wantErr {
				if err == nil {
					t.Errorf("NewRmmScanProvider() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("NewRmmScanProvider() error = %v, want error containing %v", err, tt.errContains)
				}
			} else {
				if err != nil {
					t.Errorf("NewRmmScanProvider() unexpected error = %v", err)
					return
				}
				if provider == nil {
					t.Errorf("NewRmmScanProvider() returned nil provider")
				}
			}
		})
	}
}

func TestRmmScanProvider_Scan(t *testing.T) {
	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check authorization header
		auth := r.Header.Get("Authorization")
		if auth != "Token test-api-key" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// Handle different endpoints
		if strings.Contains(r.URL.Path, "/updates") {
			updates := []RmmUpdateInfo{
				{
					UpdateID:    "KB5001234",
					Title:       "Security Update for Windows",
					Description: "Important security update",
					Severity:    "Critical",
					IsInstalled: false,
				},
				{
					UpdateID:    "KB5001235",
					Title:       "Update for .NET Framework",
					Description: "Bug fixes",
					Severity:    "Moderate",
					IsInstalled: true,
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(updates)
		} else if strings.Contains(r.URL.Path, "/agents/") {
			systemInfo := map[string]interface{}{
				"hostname": "test-server",
				"os":       "Windows 10",
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(systemInfo)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL, "test-api-key")
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	tests := []struct {
		name        string
		target      string
		wantErr     bool
		errContains string
	}{
		{
			name:    "valid scan",
			target:  "agent-123",
			wantErr: false,
		},
		{
			name:        "empty target",
			target:      "",
			wantErr:     true,
			errContains: "cannot be empty",
		},
		{
			name:        "invalid characters in target",
			target:      "agent;rm -rf /",
			wantErr:     true,
			errContains: "invalid characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := provider.Scan(tt.target)
			if tt.wantErr {
				if err == nil {
					t.Errorf("Scan() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("Scan() error = %v, want error containing %v", err, tt.errContains)
				}
			} else {
				if err != nil {
					t.Errorf("Scan() unexpected error = %v", err)
					return
				}
				if result == "" {
					t.Errorf("Scan() returned empty result")
					return
				}

				// Verify the result is valid JSON
				var scanResult RmmScanResult
				if err := json.Unmarshal([]byte(result), &scanResult); err != nil {
					t.Errorf("Scan() result is not valid JSON: %v", err)
					return
				}

				// Verify the scan result contains expected data
				if scanResult.AgentID != tt.target {
					t.Errorf("Scan() AgentID = %v, want %v", scanResult.AgentID, tt.target)
				}
				if scanResult.Status != "completed" {
					t.Errorf("Scan() Status = %v, want completed", scanResult.Status)
				}
				if len(scanResult.Updates) == 0 {
					t.Errorf("Scan() returned no updates")
				}
			}
		})
	}
}

func TestRmmScanProvider_InstallUpdate(t *testing.T) {
	// Create a test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check authorization header
		auth := r.Header.Get("Authorization")
		if auth != "Token test-api-key" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// Verify it's a POST request to install endpoint
		if r.Method != "POST" || !strings.Contains(r.URL.Path, "/install") {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		w.WriteHeader(http.StatusAccepted)
		fmt.Fprintf(w, `{"status": "queued"}`)
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL, "test-api-key")
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	tests := []struct {
		name        string
		agentID     string
		updateID    string
		wantErr     bool
		errContains string
	}{
		{
			name:     "valid install",
			agentID:  "agent-123",
			updateID: "KB5001234",
			wantErr:  false,
		},
		{
			name:        "empty agent ID",
			agentID:     "",
			updateID:    "KB5001234",
			wantErr:     true,
			errContains: "cannot be empty",
		},
		{
			name:        "empty update ID",
			agentID:     "agent-123",
			updateID:    "",
			wantErr:     true,
			errContains: "cannot be empty",
		},
		{
			name:        "invalid characters in agent ID",
			agentID:     "agent;rm -rf /",
			updateID:    "KB5001234",
			wantErr:     true,
			errContains: "invalid characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := provider.InstallUpdate(tt.agentID, tt.updateID)
			if tt.wantErr {
				if err == nil {
					t.Errorf("InstallUpdate() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("InstallUpdate() error = %v, want error containing %v", err, tt.errContains)
				}
			} else {
				if err != nil {
					t.Errorf("InstallUpdate() unexpected error = %v", err)
				}
			}
		})
	}
}

func TestRmmScanProvider_ErrorHandling(t *testing.T) {
	// Create a test server that returns errors
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/bad-agent/") {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprintf(w, `{"error": "Agent not found"}`)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, `{"error": "Internal server error"}`)
		}
	}))
	defer server.Close()

	provider, err := NewRmmScanProvider(server.URL, "test-api-key")
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	// Test error handling
	result, err := provider.Scan("bad-agent")
	if err == nil {
		t.Errorf("Scan() expected error for non-existent agent but got none")
		return
	}
	if result != "" {
		t.Errorf("Scan() expected empty result on error but got: %v", result)
	}
}

func TestGetScanProvider_RMM(t *testing.T) {
	tests := []struct {
		name         string
		typ          string
		clientId     string
		clientSecret string
		wantErr      bool
		wantNil      bool
	}{
		{
			name:         "RMM provider",
			typ:          "RMM",
			clientId:     "http://localhost:8000",
			clientSecret: "test-key",
			wantErr:      false,
			wantNil:      false,
		},
		{
			name:         "RMM provider with invalid URL",
			typ:          "RMM",
			clientId:     "",
			clientSecret: "test-key",
			wantErr:      true,
			wantNil:      false,
		},
		{
			name:         "Nmap provider",
			typ:          "Nmap",
			clientId:     "/usr/bin/nmap",
			clientSecret: "",
			wantErr:      false,
			wantNil:      false,
		},
		{
			name:         "Unknown provider",
			typ:          "Unknown",
			clientId:     "test",
			clientSecret: "",
			wantErr:      false,
			wantNil:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			provider, err := GetScanProvider(tt.typ, tt.clientId, tt.clientSecret, "en")
			if tt.wantErr {
				if err == nil {
					t.Errorf("GetScanProvider() expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("GetScanProvider() unexpected error = %v", err)
					return
				}
				if tt.wantNil && provider != nil {
					t.Errorf("GetScanProvider() expected nil provider but got one")
				}
				if !tt.wantNil && provider == nil {
					t.Errorf("GetScanProvider() expected provider but got nil")
				}
			}
		})
	}
}
