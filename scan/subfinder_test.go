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

// TestParseSubfinderOutput tests parsing Subfinder JSON output
func TestParseSubfinderOutput(t *testing.T) {
	provider := &SubfinderScanProvider{
		subfinderPath: "subfinder",
	}

	// Sample JSON output from Subfinder
	sampleOutput := `{"host":"www.example.com","input":"example.com","source":["crtsh","hackertarget"]}
{"host":"mail.example.com","input":"example.com","source":["dnsdumpster"]}`

	result := provider.parseSubfinderOutput(sampleOutput)

	// Verify the parsed result
	if len(result.Subdomains) != 2 {
		t.Errorf("Expected 2 subdomains, got %d", len(result.Subdomains))
	}

	// Check first subdomain
	subdomain1 := result.Subdomains[0]
	if subdomain1.Host != "www.example.com" {
		t.Errorf("Expected host www.example.com, got %s", subdomain1.Host)
	}
	if subdomain1.Input != "example.com" {
		t.Errorf("Expected input example.com, got %s", subdomain1.Input)
	}
	if len(subdomain1.Source) != 2 {
		t.Errorf("Expected 2 sources, got %d", len(subdomain1.Source))
	}

	// Check summary
	if result.Summary.TotalSubdomains != 2 {
		t.Errorf("Expected total 2 subdomains, got %d", result.Summary.TotalSubdomains)
	}
	if result.Summary.BySource["crtsh"] != 1 {
		t.Errorf("Expected 1 subdomain from crtsh, got %d", result.Summary.BySource["crtsh"])
	}
	if result.Summary.BySource["dnsdumpster"] != 1 {
		t.Errorf("Expected 1 subdomain from dnsdumpster, got %d", result.Summary.BySource["dnsdumpster"])
	}
}

// TestParseSubfinderEmptyOutput tests parsing empty Subfinder output
func TestParseSubfinderEmptyOutput(t *testing.T) {
	provider := &SubfinderScanProvider{
		subfinderPath: "subfinder",
	}

	result := provider.parseSubfinderOutput("")

	if len(result.Subdomains) != 0 {
		t.Errorf("Expected 0 subdomains, got %d", len(result.Subdomains))
	}
	if result.Summary.TotalSubdomains != 0 {
		t.Errorf("Expected total 0 subdomains, got %d", result.Summary.TotalSubdomains)
	}
}

// TestSubfinderParseResult tests the ParseResult method
func TestSubfinderParseResult(t *testing.T) {
	provider := &SubfinderScanProvider{
		subfinderPath: "subfinder",
	}

	// Test with valid JSON output
	rawResult := `{"host":"test.example.com","input":"example.com","source":["crtsh"]}`

	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("ParseResult failed: %v", err)
	}

	var scanResult SubfinderScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	if len(scanResult.Subdomains) != 1 {
		t.Errorf("Expected 1 subdomain, got %d", len(scanResult.Subdomains))
	}
	if scanResult.Subdomains[0].Host != "test.example.com" {
		t.Errorf("Expected host test.example.com, got %s", scanResult.Subdomains[0].Host)
	}

	// Test with empty result
	emptyResult, err := provider.ParseResult("")
	if err != nil {
		t.Fatalf("ParseResult failed for empty input: %v", err)
	}

	var emptyScanResult SubfinderScanResult
	err = json.Unmarshal([]byte(emptyResult), &emptyScanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal empty result: %v", err)
	}

	if len(emptyScanResult.Subdomains) != 0 {
		t.Errorf("Expected 0 subdomains for empty input, got %d", len(emptyScanResult.Subdomains))
	}
}

// TestSubfinderGetResultSummary tests the GetResultSummary method
func TestSubfinderGetResultSummary(t *testing.T) {
	provider := &SubfinderScanProvider{
		subfinderPath: "subfinder",
	}

	tests := []struct {
		name     string
		result   SubfinderScanResult
		expected string
	}{
		{
			name: "No subdomains",
			result: SubfinderScanResult{
				Subdomains: []SubfinderSubdomain{},
				Summary: SubfinderSummary{
					TotalSubdomains: 0,
					BySource:        map[string]int{},
				},
			},
			expected: "No subdomains found",
		},
		{
			name: "Multiple subdomains from multiple sources",
			result: SubfinderScanResult{
				Subdomains: []SubfinderSubdomain{
					{Host: "www.example.com", Source: []string{"crtsh"}},
					{Host: "mail.example.com", Source: []string{"dnsdumpster"}},
					{Host: "api.example.com", Source: []string{"hackertarget"}},
				},
				Summary: SubfinderSummary{
					TotalSubdomains: 3,
					BySource:        map[string]int{"crtsh": 1, "dnsdumpster": 1, "hackertarget": 1},
				},
			},
			expected: "3 subdomains from 3 sources",
		},
		{
			name: "Single subdomain",
			result: SubfinderScanResult{
				Subdomains: []SubfinderSubdomain{
					{Host: "www.example.com", Source: []string{"crtsh"}},
				},
				Summary: SubfinderSummary{
					TotalSubdomains: 1,
					BySource:        map[string]int{"crtsh": 1},
				},
			},
			expected: "1 subdomain from 1 sources",
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

// TestSubfinderScanProvider tests the Subfinder scan functionality (if subfinder is available)
func TestSubfinderScanProvider(t *testing.T) {
	// Skip if subfinder is not available
	if !IsSubfinderAvailable("") {
		t.Skip("Skipping test: subfinder not available in system PATH")
	}

	provider, err := NewSubfinderScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create SubfinderScanProvider: %v", err)
	}

	// Test with a well-known domain
	// Use -json for structured output
	t.Log("Testing Subfinder scan on example.com...")
	rawResult, err := provider.Scan("example.com", "-d %s -json -silent")
	if err != nil {
		// It's okay if scan fails (API rate limits or network issues)
		t.Logf("Scan failed (expected if rate limited or network issues): %v", err)
		return
	}

	t.Logf("Raw result length: %d bytes", len(rawResult))

	// Parse the result
	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	var scanResult SubfinderScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	t.Logf("Found %d subdomains", scanResult.Summary.TotalSubdomains)
	for i, subdomain := range scanResult.Subdomains {
		if i < 5 { // Only log first 5 subdomains
			t.Logf("Subdomain %d: %s (Sources: %v)", i+1, subdomain.Host, subdomain.Source)
		}
	}

	// Get summary
	summary := provider.GetResultSummary(result)
	t.Logf("Summary: %s", summary)
}

// Example demonstrates how to use the SubfinderScanProvider
func ExampleSubfinderScanProvider_Scan() {
	provider, err := NewSubfinderScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Scan a domain
	rawResult, err := provider.Scan("example.com", "-d %s -json")
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

	var scanResult SubfinderScanResult
	json.Unmarshal([]byte(result), &scanResult)

	fmt.Printf("Found %d subdomains\n", scanResult.Summary.TotalSubdomains)
}
