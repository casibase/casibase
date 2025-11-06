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
	"fmt"
	"testing"
)

// TestParseNucleiOutput tests parsing Nuclei JSONL output
func TestParseNucleiOutput(t *testing.T) {
	provider := &NucleiScanProvider{
		nucleiPath: "nuclei",
	}

	// Sample JSONL output from Nuclei
	sampleOutput := `{"template-id":"CVE-2021-12345","info":{"name":"Test Vulnerability","severity":"high","description":"Test description"},"type":"http","host":"http://example.com","matched-at":"http://example.com/admin","ip":"192.168.1.1","timestamp":"2025-01-01T12:00:00Z"}
{"template-id":"CVE-2021-67890","info":{"name":"Another Vulnerability","severity":"medium"},"type":"http","host":"http://example.com","matched-at":"http://example.com/login"}`

	result := provider.parseNucleiOutput(sampleOutput)

	// Verify the parsed result
	if len(result.Vulnerabilities) != 2 {
		t.Errorf("Expected 2 vulnerabilities, got %d", len(result.Vulnerabilities))
	}

	// Check first vulnerability
	vuln1 := result.Vulnerabilities[0]
	if vuln1.TemplateID != "CVE-2021-12345" {
		t.Errorf("Expected template ID CVE-2021-12345, got %s", vuln1.TemplateID)
	}
	if vuln1.Name != "Test Vulnerability" {
		t.Errorf("Expected name 'Test Vulnerability', got %s", vuln1.Name)
	}
	if vuln1.Severity != "high" {
		t.Errorf("Expected severity 'high', got %s", vuln1.Severity)
	}
	if vuln1.Host != "http://example.com" {
		t.Errorf("Expected host 'http://example.com', got %s", vuln1.Host)
	}

	// Check summary
	if result.Summary.TotalVulnerabilities != 2 {
		t.Errorf("Expected total 2 vulnerabilities, got %d", result.Summary.TotalVulnerabilities)
	}
	if result.Summary.BySeverity["high"] != 1 {
		t.Errorf("Expected 1 high severity, got %d", result.Summary.BySeverity["high"])
	}
	if result.Summary.BySeverity["medium"] != 1 {
		t.Errorf("Expected 1 medium severity, got %d", result.Summary.BySeverity["medium"])
	}
}

// TestParseNucleiEmptyOutput tests parsing empty Nuclei output
func TestParseNucleiEmptyOutput(t *testing.T) {
	provider := &NucleiScanProvider{
		nucleiPath: "nuclei",
	}

	result := provider.parseNucleiOutput("")

	if len(result.Vulnerabilities) != 0 {
		t.Errorf("Expected 0 vulnerabilities, got %d", len(result.Vulnerabilities))
	}
	if result.Summary.TotalVulnerabilities != 0 {
		t.Errorf("Expected total 0 vulnerabilities, got %d", result.Summary.TotalVulnerabilities)
	}
}

// TestNucleiParseResult tests the ParseResult method
func TestNucleiParseResult(t *testing.T) {
	provider := &NucleiScanProvider{
		nucleiPath: "nuclei",
	}

	// Test with valid JSONL output
	rawResult := `{"template-id":"test-vuln","info":{"name":"Test","severity":"critical"},"type":"http","host":"http://test.com","matched-at":"http://test.com/admin"}`

	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("ParseResult failed: %v", err)
	}

	var scanResult NucleiScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	if len(scanResult.Vulnerabilities) != 1 {
		t.Errorf("Expected 1 vulnerability, got %d", len(scanResult.Vulnerabilities))
	}
	if scanResult.Vulnerabilities[0].Severity != "critical" {
		t.Errorf("Expected severity 'critical', got %s", scanResult.Vulnerabilities[0].Severity)
	}

	// Test with empty result
	emptyResult, err := provider.ParseResult("")
	if err != nil {
		t.Fatalf("ParseResult failed for empty input: %v", err)
	}

	var emptyScanResult NucleiScanResult
	err = json.Unmarshal([]byte(emptyResult), &emptyScanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal empty result: %v", err)
	}

	if len(emptyScanResult.Vulnerabilities) != 0 {
		t.Errorf("Expected 0 vulnerabilities for empty input, got %d", len(emptyScanResult.Vulnerabilities))
	}
}

// TestNucleiGetResultSummary tests the GetResultSummary method
func TestNucleiGetResultSummary(t *testing.T) {
	provider := &NucleiScanProvider{
		nucleiPath: "nuclei",
	}

	tests := []struct {
		name     string
		result   NucleiScanResult
		expected string
	}{
		{
			name: "No vulnerabilities",
			result: NucleiScanResult{
				Vulnerabilities: []NucleiVulnerability{},
				Summary: NucleiSummary{
					TotalVulnerabilities: 0,
					BySeverity:           map[string]int{},
				},
			},
			expected: "No vulnerabilities found",
		},
		{
			name: "Critical vulnerabilities",
			result: NucleiScanResult{
				Vulnerabilities: []NucleiVulnerability{
					{Severity: "critical"},
					{Severity: "high"},
				},
				Summary: NucleiSummary{
					TotalVulnerabilities: 2,
					BySeverity:           map[string]int{"critical": 1, "high": 1},
				},
			},
			expected: "2 vulnerabilities (1 critical)",
		},
		{
			name: "High vulnerabilities only",
			result: NucleiScanResult{
				Vulnerabilities: []NucleiVulnerability{
					{Severity: "high"},
					{Severity: "high"},
				},
				Summary: NucleiSummary{
					TotalVulnerabilities: 2,
					BySeverity:           map[string]int{"high": 2},
				},
			},
			expected: "2 vulnerabilities (2 high)",
		},
		{
			name: "Low vulnerabilities only",
			result: NucleiScanResult{
				Vulnerabilities: []NucleiVulnerability{
					{Severity: "low"},
				},
				Summary: NucleiSummary{
					TotalVulnerabilities: 1,
					BySeverity:           map[string]int{"low": 1},
				},
			},
			expected: "1 vulnerability (1 low)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, err := json.Marshal(tt.result)
			if err != nil {
				t.Fatalf("Failed to marshal test data: %v", err)
			}

			summary := provider.GetResultSummary(string(jsonData))
			if summary != tt.expected {
				t.Errorf("Expected summary '%s', got '%s'", tt.expected, summary)
			}
		})
	}
}

// TestNucleiScanProvider tests the Nuclei scan functionality (if nuclei is available)
func TestNucleiScanProvider(t *testing.T) {
	// Skip if nuclei is not available
	if !IsNucleiAvailable("") {
		t.Skip("Skipping test: nuclei not available in system PATH")
	}

	provider, err := NewNucleiScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create NucleiScanProvider: %v", err)
	}

	// Test with a safe target (localhost)
	// Use -jsonl for structured output
	t.Log("Testing Nuclei scan on localhost...")
	rawResult, err := provider.Scan("http://localhost", "-u %s -jsonl -t http/miscellaneous/")
	if err != nil {
		// It's okay if scan fails (localhost may not be running)
		t.Logf("Scan failed (expected if localhost not accessible): %v", err)
		return
	}

	t.Logf("Raw result length: %d bytes", len(rawResult))

	// Parse the result
	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	var scanResult NucleiScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	t.Logf("Found %d vulnerabilities", scanResult.Summary.TotalVulnerabilities)
	for i, vuln := range scanResult.Vulnerabilities {
		t.Logf("Vulnerability %d: %s (Severity: %s)", i+1, vuln.Name, vuln.Severity)
	}

	// Get summary
	summary := provider.GetResultSummary(result)
	t.Logf("Summary: %s", summary)
}

// Example demonstrates how to use the NucleiScanProvider
func ExampleNucleiScanProvider_Scan() {
	provider, err := NewNucleiScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Scan a target URL
	rawResult, err := provider.Scan("https://example.com", "-u %s -jsonl")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Parse the result
	result, err := provider.ParseResult(rawResult)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	var scanResult NucleiScanResult
	json.Unmarshal([]byte(result), &scanResult)

	fmt.Printf("Found %d vulnerabilities\n", scanResult.Summary.TotalVulnerabilities)
}
