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

// TestParseHttpxOutput tests parsing httpx JSON output
func TestParseHttpxOutput(t *testing.T) {
	provider := &HttpxScanProvider{
		httpxPath: "httpx",
	}

	// Sample JSON output from httpx
	sampleOutput := `{"timestamp":"2024-01-01T00:00:00Z","url":"https://example.com","input":"example.com","title":"Example Domain","scheme":"https","webserver":"Apache","content_type":"text/html","method":"GET","host":"example.com","path":"/","status_code":200,"content_length":1256,"words":100,"lines":50,"technologies":["Apache","PHP"]}
{"timestamp":"2024-01-01T00:00:01Z","url":"http://test.example.com","input":"test.example.com","title":"Test Page","scheme":"http","status_code":404,"content_length":500}`

	result := provider.parseHttpxOutput(sampleOutput)

	// Verify the parsed result
	if len(result.Hosts) != 2 {
		t.Errorf("Expected 2 hosts, got %d", len(result.Hosts))
	}

	// Check first host
	host1 := result.Hosts[0]
	if host1.URL != "https://example.com" {
		t.Errorf("Expected URL https://example.com, got %s", host1.URL)
	}
	if host1.StatusCode != 200 {
		t.Errorf("Expected status code 200, got %d", host1.StatusCode)
	}
	if host1.Scheme != "https" {
		t.Errorf("Expected scheme https, got %s", host1.Scheme)
	}
	if len(host1.Technologies) != 2 {
		t.Errorf("Expected 2 technologies, got %d", len(host1.Technologies))
	}

	// Check summary
	if result.Summary.TotalHosts != 2 {
		t.Errorf("Expected total 2 hosts, got %d", result.Summary.TotalHosts)
	}
	if result.Summary.ByStatusCode["200"] != 1 {
		t.Errorf("Expected 1 host with status 200, got %d", result.Summary.ByStatusCode["200"])
	}
	if result.Summary.ByStatusCode["404"] != 1 {
		t.Errorf("Expected 1 host with status 404, got %d", result.Summary.ByStatusCode["404"])
	}
	if result.Summary.ByScheme["https"] != 1 {
		t.Errorf("Expected 1 https host, got %d", result.Summary.ByScheme["https"])
	}
	if result.Summary.ByScheme["http"] != 1 {
		t.Errorf("Expected 1 http host, got %d", result.Summary.ByScheme["http"])
	}
	if result.Summary.WithTech != 1 {
		t.Errorf("Expected 1 host with technologies, got %d", result.Summary.WithTech)
	}
}

// TestParseHttpxEmptyOutput tests parsing empty httpx output
func TestParseHttpxEmptyOutput(t *testing.T) {
	provider := &HttpxScanProvider{
		httpxPath: "httpx",
	}

	result := provider.parseHttpxOutput("")

	if len(result.Hosts) != 0 {
		t.Errorf("Expected 0 hosts, got %d", len(result.Hosts))
	}
	if result.Summary.TotalHosts != 0 {
		t.Errorf("Expected total 0 hosts, got %d", result.Summary.TotalHosts)
	}
}

// TestHttpxParseResult tests the ParseResult method
func TestHttpxParseResult(t *testing.T) {
	provider := &HttpxScanProvider{
		httpxPath: "httpx",
	}

	// Test with valid JSON output
	rawResult := `{"url":"https://test.example.com","input":"test.example.com","status_code":200,"scheme":"https"}`

	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("ParseResult failed: %v", err)
	}

	var scanResult HttpxScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	if len(scanResult.Hosts) != 1 {
		t.Errorf("Expected 1 host, got %d", len(scanResult.Hosts))
	}
	if scanResult.Hosts[0].URL != "https://test.example.com" {
		t.Errorf("Expected URL https://test.example.com, got %s", scanResult.Hosts[0].URL)
	}

	// Test with empty result
	emptyResult, err := provider.ParseResult("")
	if err != nil {
		t.Fatalf("ParseResult failed for empty input: %v", err)
	}

	var emptyScanResult HttpxScanResult
	err = json.Unmarshal([]byte(emptyResult), &emptyScanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal empty result: %v", err)
	}

	if len(emptyScanResult.Hosts) != 0 {
		t.Errorf("Expected 0 hosts for empty input, got %d", len(emptyScanResult.Hosts))
	}
}

// TestHttpxGetResultSummary tests the GetResultSummary method
func TestHttpxGetResultSummary(t *testing.T) {
	provider := &HttpxScanProvider{
		httpxPath: "httpx",
	}

	tests := []struct {
		name     string
		result   HttpxScanResult
		expected string
	}{
		{
			name: "No hosts",
			result: HttpxScanResult{
				Hosts: []HttpxHost{},
				Summary: HttpxSummary{
					TotalHosts:   0,
					ByStatusCode: map[string]int{},
					ByScheme:     map[string]int{},
					WithTech:     0,
				},
			},
			expected: "No hosts found",
		},
		{
			name: "Multiple hosts with successful responses",
			result: HttpxScanResult{
				Hosts: []HttpxHost{
					{URL: "https://example.com", StatusCode: 200},
					{URL: "https://test.example.com", StatusCode: 200},
					{URL: "http://api.example.com", StatusCode: 404},
				},
				Summary: HttpxSummary{
					TotalHosts:   3,
					ByStatusCode: map[string]int{"200": 2, "404": 1},
					ByScheme:     map[string]int{"https": 2, "http": 1},
					WithTech:     1,
				},
			},
			expected: "3 hosts (2 successful)",
		},
		{
			name: "Single host",
			result: HttpxScanResult{
				Hosts: []HttpxHost{
					{URL: "https://example.com", StatusCode: 200},
				},
				Summary: HttpxSummary{
					TotalHosts:   1,
					ByStatusCode: map[string]int{"200": 1},
					ByScheme:     map[string]int{"https": 1},
					WithTech:     0,
				},
			},
			expected: "1 host (1 successful)",
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

// TestHttpxScanProvider tests the httpx scan functionality (if httpx is available)
func TestHttpxScanProvider(t *testing.T) {
	// Skip if httpx is not available
	if !IsHttpxAvailable("") {
		t.Skip("Skipping test: httpx not available in system PATH")
	}

	provider, err := NewHttpxScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create HttpxScanProvider: %v", err)
	}

	// Test with a well-known domain
	// Use -json for structured output and -silent for cleaner output
	t.Log("Testing httpx scan on example.com...")
	rawResult, err := provider.Scan("https://example.com", "-u %s -json -silent")
	if err != nil {
		// It's okay if scan fails (network issues)
		t.Logf("Scan failed (expected if network issues): %v", err)
		return
	}

	t.Logf("Raw result length: %d bytes", len(rawResult))

	// Parse the result
	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	var scanResult HttpxScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	t.Logf("Found %d hosts", scanResult.Summary.TotalHosts)
	for i, host := range scanResult.Hosts {
		if i < 5 { // Only log first 5 hosts
			t.Logf("Host %d: %s (Status: %d, Scheme: %s)", i+1, host.URL, host.StatusCode, host.Scheme)
		}
	}

	// Get summary
	summary := provider.GetResultSummary(result)
	t.Logf("Summary: %s", summary)
}

// Example demonstrates how to use the HttpxScanProvider
func ExampleHttpxScanProvider_Scan() {
	provider, err := NewHttpxScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Scan a URL
	rawResult, err := provider.Scan("https://example.com", "-u %s -json")
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

	var scanResult HttpxScanResult
	json.Unmarshal([]byte(result), &scanResult)

	fmt.Printf("Found %d hosts\n", scanResult.Summary.TotalHosts)
}
