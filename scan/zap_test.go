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

// TestParseZapOutput tests parsing ZAP JSON output
func TestParseZapOutput(t *testing.T) {
	provider := &ZapScanProvider{
		zapPath: "zap.bat",
	}

	// Sample JSON output from ZAP
	sampleOutput := `{
		"site": [
			{
				"@name": "http://example.com",
				"@host": "example.com",
				"@port": "80",
				"@ssl": "false",
				"alerts": [
					{
						"pluginid": "10021",
						"alertRef": "10021",
						"alert": "X-Content-Type-Options Header Missing",
						"name": "X-Content-Type-Options Header Missing",
						"riskcode": "1",
						"confidence": "2",
						"riskdesc": "Low (Medium)",
						"desc": "The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'.",
						"count": "2",
						"solution": "Ensure that the application/web server sets the Content-Type header appropriately.",
						"reference": "http://msdn.microsoft.com/en-us/library/ie/gg622941%28v=vs.85%29.aspx",
						"cweid": "16",
						"wascid": "15",
						"sourceid": "3"
					},
					{
						"pluginid": "10038",
						"alertRef": "10038",
						"alert": "Content Security Policy (CSP) Header Not Set",
						"name": "Content Security Policy (CSP) Header Not Set",
						"riskcode": "2",
						"confidence": "3",
						"riskdesc": "Medium (High)",
						"desc": "Content Security Policy (CSP) is an added layer of security.",
						"count": "1",
						"solution": "Ensure that your web server sets the CSP header.",
						"reference": "https://developer.mozilla.org/en-US/docs/Web/Security/CSP",
						"cweid": "693",
						"wascid": "15",
						"sourceid": "3"
					}
				]
			}
		]
	}`

	result := provider.parseZapOutput(sampleOutput)

	// Verify the parsed result
	if len(result.Sites) != 1 {
		t.Errorf("Expected 1 site, got %d", len(result.Sites))
	}

	site := result.Sites[0]
	if site.Name != "http://example.com" {
		t.Errorf("Expected site name 'http://example.com', got %s", site.Name)
	}
	if site.Host != "example.com" {
		t.Errorf("Expected host 'example.com', got %s", site.Host)
	}

	if len(site.Alerts) != 2 {
		t.Errorf("Expected 2 alerts, got %d", len(site.Alerts))
	}

	// Check first alert
	alert1 := site.Alerts[0]
	if alert1.PluginID != "10021" {
		t.Errorf("Expected plugin ID 10021, got %s", alert1.PluginID)
	}
	if alert1.Name != "X-Content-Type-Options Header Missing" {
		t.Errorf("Expected alert name 'X-Content-Type-Options Header Missing', got %s", alert1.Name)
	}
	if alert1.RiskDesc != "Low (Medium)" {
		t.Errorf("Expected risk desc 'Low (Medium)', got %s", alert1.RiskDesc)
	}

	// Check summary
	if result.Summary.TotalAlerts != 2 {
		t.Errorf("Expected total 2 alerts, got %d", result.Summary.TotalAlerts)
	}
	if result.Summary.ByRisk["Low"] != 1 {
		t.Errorf("Expected 1 low risk, got %d", result.Summary.ByRisk["Low"])
	}
	if result.Summary.ByRisk["Medium"] != 1 {
		t.Errorf("Expected 1 medium risk, got %d", result.Summary.ByRisk["Medium"])
	}
}

// TestParseZapEmptyOutput tests parsing empty ZAP output
func TestParseZapEmptyOutput(t *testing.T) {
	provider := &ZapScanProvider{
		zapPath: "zap.bat",
	}

	result := provider.parseZapOutput("")

	if len(result.Sites) != 0 {
		t.Errorf("Expected 0 sites, got %d", len(result.Sites))
	}
	if result.Summary.TotalAlerts != 0 {
		t.Errorf("Expected total 0 alerts, got %d", result.Summary.TotalAlerts)
	}
}

// TestZapParseResult tests the ParseResult method
func TestZapParseResult(t *testing.T) {
	provider := &ZapScanProvider{
		zapPath: "zap.bat",
	}

	// Test with valid JSON output
	rawResult := `{
		"site": [
			{
				"@name": "http://test.com",
				"@host": "test.com",
				"@port": "80",
				"@ssl": "false",
				"alerts": [
					{
						"pluginid": "90001",
						"alert": "Test Alert",
						"name": "Test Alert",
						"riskcode": "3",
						"confidence": "3",
						"riskdesc": "High (High)",
						"desc": "Test description",
						"count": "1"
					}
				]
			}
		]
	}`

	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("ParseResult failed: %v", err)
	}

	var scanResult ZapScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	if len(scanResult.Sites) != 1 {
		t.Errorf("Expected 1 site, got %d", len(scanResult.Sites))
	}
	if scanResult.Summary.TotalAlerts != 1 {
		t.Errorf("Expected 1 alert, got %d", scanResult.Summary.TotalAlerts)
	}

	// Test with empty result
	emptyResult, err := provider.ParseResult("")
	if err != nil {
		t.Fatalf("ParseResult failed for empty input: %v", err)
	}

	var emptyScanResult ZapScanResult
	err = json.Unmarshal([]byte(emptyResult), &emptyScanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal empty result: %v", err)
	}

	if len(emptyScanResult.Sites) != 0 {
		t.Errorf("Expected 0 sites for empty input, got %d", len(emptyScanResult.Sites))
	}
}

// TestZapGetResultSummary tests the GetResultSummary method
func TestZapGetResultSummary(t *testing.T) {
	provider := &ZapScanProvider{
		zapPath: "zap.bat",
	}

	tests := []struct {
		name     string
		result   ZapScanResult
		expected string
	}{
		{
			name: "No alerts",
			result: ZapScanResult{
				Sites: []ZapSite{},
				Summary: ZapSummary{
					TotalAlerts: 0,
					ByRisk:      map[string]int{},
				},
			},
			expected: "No alerts found",
		},
		{
			name: "High risk alerts",
			result: ZapScanResult{
				Sites: []ZapSite{
					{
						Alerts: []ZapAlert{
							{RiskDesc: "High (Warning)"},
							{RiskDesc: "Medium (Medium)"},
						},
					},
				},
				Summary: ZapSummary{
					TotalAlerts: 2,
					ByRisk:      map[string]int{"High": 1, "Medium": 1},
				},
			},
			expected: "2 alerts (1 high)",
		},
		{
			name: "Medium risk alerts only",
			result: ZapScanResult{
				Sites: []ZapSite{
					{
						Alerts: []ZapAlert{
							{RiskDesc: "Medium (High)"},
							{RiskDesc: "Medium (Medium)"},
						},
					},
				},
				Summary: ZapSummary{
					TotalAlerts: 2,
					ByRisk:      map[string]int{"Medium": 2},
				},
			},
			expected: "2 alerts (2 medium)",
		},
		{
			name: "Low risk alerts only",
			result: ZapScanResult{
				Sites: []ZapSite{
					{
						Alerts: []ZapAlert{
							{RiskDesc: "Low (Medium)"},
						},
					},
				},
				Summary: ZapSummary{
					TotalAlerts: 1,
					ByRisk:      map[string]int{"Low": 1},
				},
			},
			expected: "1 alert (1 low)",
		},
		{
			name: "Informational alerts only",
			result: ZapScanResult{
				Sites: []ZapSite{
					{
						Alerts: []ZapAlert{
							{RiskDesc: "Informational (Medium)"},
						},
					},
				},
				Summary: ZapSummary{
					TotalAlerts: 1,
					ByRisk:      map[string]int{"Informational": 1},
				},
			},
			expected: "1 alert (1 informational)",
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

// TestZapScanProvider tests the ZAP scan functionality (if ZAP is available)
func TestZapScanProvider(t *testing.T) {
	// Skip if ZAP is not available
	if !IsZapAvailable("") {
		t.Skip("Skipping test: ZAP not available in system PATH")
	}

	provider, err := NewZapScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create ZapScanProvider: %v", err)
	}

	// Test with a safe target (example.com)
	// Use quick scan mode
	t.Log("Testing ZAP scan on example.com...")
	rawResult, err := provider.Scan("http://example.com", "-cmd -quickurl %s -quickout /dev/stdout -quickprogress")
	if err != nil {
		// It's okay if scan fails (ZAP may not be properly configured)
		t.Logf("Scan failed (expected if ZAP not configured): %v", err)
		return
	}

	t.Logf("Raw result length: %d bytes", len(rawResult))

	// Parse the result
	result, err := provider.ParseResult(rawResult)
	if err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	var scanResult ZapScanResult
	err = json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		t.Fatalf("Failed to unmarshal result: %v", err)
	}

	t.Logf("Found %d alert(s) across %d site(s)", scanResult.Summary.TotalAlerts, len(scanResult.Sites))
	for i, site := range scanResult.Sites {
		t.Logf("Site %d: %s (%d alerts)", i+1, site.Name, len(site.Alerts))
		for j, alert := range site.Alerts {
			t.Logf("  Alert %d: %s (Risk: %s)", j+1, alert.Name, alert.RiskDesc)
		}
	}

	// Get summary
	summary := provider.GetResultSummary(result)
	t.Logf("Summary: %s", summary)
}

// Example demonstrates how to use the ZapScanProvider
func ExampleZapScanProvider_Scan() {
	provider, err := NewZapScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Scan a target URL
	rawResult, err := provider.Scan("http://example.com", "-cmd -quickurl %s -quickout /dev/stdout")
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

	var scanResult ZapScanResult
	json.Unmarshal([]byte(result), &scanResult)

	fmt.Printf("Found %d alerts\n", scanResult.Summary.TotalAlerts)
}
