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
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

// NucleiVulnerability represents a single vulnerability found by Nuclei
type NucleiVulnerability struct {
	TemplateID   string                 `json:"templateID"`
	Name         string                 `json:"name"`
	Type         string                 `json:"type"`
	Severity     string                 `json:"severity"`
	Host         string                 `json:"host"`
	MatchedAt    string                 `json:"matchedAt"`
	ExtractedResults []string           `json:"extractedResults,omitempty"`
	IP           string                 `json:"ip,omitempty"`
	Timestamp    string                 `json:"timestamp,omitempty"`
	CurlCommand  string                 `json:"curlCommand,omitempty"`
	Description  string                 `json:"description,omitempty"`
	Reference    []string               `json:"reference,omitempty"`
	Classification map[string]interface{} `json:"classification,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// NucleiScanResult represents the complete Nuclei scan result
type NucleiScanResult struct {
	Vulnerabilities []NucleiVulnerability `json:"vulnerabilities"`
	Summary         NucleiSummary         `json:"summary"`
}

// NucleiSummary provides a summary of the scan results
type NucleiSummary struct {
	TotalVulnerabilities int            `json:"totalVulnerabilities"`
	BySeverity           map[string]int `json:"bySeverity"`
	ByType               map[string]int `json:"byType"`
}

type NucleiScanProvider struct {
	nucleiPath string
}

// IsNucleiAvailable checks if nuclei is available in the system
// Returns true if nuclei is available (either through clientId path or system PATH)
func IsNucleiAvailable(clientId string) bool {
	// If clientId is provided, validate the path exists and is executable
	if clientId != "" {
		// Try to run nuclei -version to verify it's executable
		cmd := exec.Command(clientId, "-version")
		err := cmd.Run()
		return err == nil
	}

	// Check if nuclei is in system PATH
	_, err := exec.LookPath("nuclei")
	return err == nil
}

func NewNucleiScanProvider(clientId string) (*NucleiScanProvider, error) {
	provider := &NucleiScanProvider{
		nucleiPath: clientId,
	}

	// If clientId is empty, try to find nuclei in system PATH
	if provider.nucleiPath == "" {
		nucleiPath, err := exec.LookPath("nuclei")
		if err != nil {
			return nil, fmt.Errorf("%s nuclei not found in system PATH, please specify the path to nuclei binary", getHostnamePrefix())
		}
		provider.nucleiPath = nucleiPath
	}

	return provider, nil
}

func (p *NucleiScanProvider) Scan(target string, command string) (string, error) {
	if target == "" {
		return "", fmt.Errorf("%s scan target cannot be empty", getHostnamePrefix())
	}

	// Validate target to prevent command injection
	target = strings.TrimSpace(target)
	if strings.ContainsAny(target, ";&|`$") {
		return "", fmt.Errorf("%s invalid characters in scan target", getHostnamePrefix())
	}

	// Use default command if empty
	if command == "" {
		command = "-u %s -jsonl"
	}

	// Validate command to prevent command injection
	command = strings.TrimSpace(command)
	if strings.ContainsAny(command, ";&|`") {
		return "", fmt.Errorf("%s invalid characters in scan command", getHostnamePrefix())
	}

	// Ensure -jsonl flag is present for structured output
	if !strings.Contains(command, "-jsonl") && !strings.Contains(command, "-json") {
		command = command + " -jsonl"
	}

	// Replace %s with target, or append target if no %s placeholder
	var args []string
	if strings.Contains(command, "%s") {
		// Replace %s with target
		cmdStr := strings.Replace(command, "%s", target, -1)
		args = strings.Fields(cmdStr)
	} else {
		// No %s placeholder, append target with -u flag if not already present
		args = strings.Fields(command)
		if !contains(args, "-u") && !contains(args, "-target") && !contains(args, "-l") {
			args = append(args, "-u", target)
		}
	}

	// Run nuclei with custom command options
	cmd := exec.Command(p.nucleiPath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	fmt.Printf("%s [Nuclei] Executing nuclei scan: %s %s\n", getHostnamePrefix(), p.nucleiPath, strings.Join(args, " "))
	err := cmd.Run()
	if err != nil {
		// Nuclei may return non-zero exit code even when scan completes successfully
		// Check if we got any output
		if stdout.Len() == 0 {
			return "", fmt.Errorf("%s nuclei scan failed: %v, stderr: %s", getHostnamePrefix(), err, stderr.String())
		}
		// Log the error but continue with parsing
		fmt.Printf("%s [Nuclei] Scan completed with warnings: %v\n", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [Nuclei] Scan completed successfully\n", getHostnamePrefix())

	result := stdout.String()
	if result == "" {
		result = "Scan completed with no vulnerabilities found"
	}

	return result, nil
}

// contains checks if a string slice contains a specific value
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func (p *NucleiScanProvider) ParseResult(rawResult string) (string, error) {
	// Parse the JSONL output into structured data
	fmt.Printf("%s [Nuclei] Parsing scan results\n", getHostnamePrefix())
	
	if rawResult == "" || rawResult == "Scan completed with no vulnerabilities found" {
		emptyResult := &NucleiScanResult{
			Vulnerabilities: []NucleiVulnerability{},
			Summary: NucleiSummary{
				TotalVulnerabilities: 0,
				BySeverity:           map[string]int{},
				ByType:               map[string]int{},
			},
		}
		jsonBytes, err := json.Marshal(emptyResult)
		if err != nil {
			return "", fmt.Errorf("%s failed to marshal empty nuclei result: %v", getHostnamePrefix(), err)
		}
		return string(jsonBytes), nil
	}

	parsedResult := p.parseNucleiOutput(rawResult)

	// Convert to JSON
	jsonBytes, err := json.Marshal(parsedResult)
	if err != nil {
		return "", fmt.Errorf("%s failed to marshal nuclei result: %v", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [Nuclei] Successfully parsed %d vulnerability/vulnerabilities\n", getHostnamePrefix(), len(parsedResult.Vulnerabilities))

	return string(jsonBytes), nil
}

// parseNucleiOutput parses the JSONL output from nuclei and creates a structured result
func (p *NucleiScanProvider) parseNucleiOutput(output string) *NucleiScanResult {
	result := &NucleiScanResult{
		Vulnerabilities: []NucleiVulnerability{},
		Summary: NucleiSummary{
			TotalVulnerabilities: 0,
			BySeverity:           make(map[string]int),
			ByType:               make(map[string]int),
		},
	}

	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse each JSON line
		var rawVuln map[string]interface{}
		err := json.Unmarshal([]byte(line), &rawVuln)
		if err != nil {
			// Skip lines that aren't valid JSON
			continue
		}

		// Extract vulnerability information
		vuln := NucleiVulnerability{}
		
		if templateID, ok := rawVuln["template-id"].(string); ok {
			vuln.TemplateID = templateID
		} else if templateID, ok := rawVuln["templateID"].(string); ok {
			vuln.TemplateID = templateID
		}

		if name, ok := rawVuln["info"].(map[string]interface{}); ok {
			if n, ok := name["name"].(string); ok {
				vuln.Name = n
			}
			if sev, ok := name["severity"].(string); ok {
				vuln.Severity = sev
			}
			if desc, ok := name["description"].(string); ok {
				vuln.Description = desc
			}
			if ref, ok := name["reference"].([]interface{}); ok {
				for _, r := range ref {
					if refStr, ok := r.(string); ok {
						vuln.Reference = append(vuln.Reference, refStr)
					}
				}
			}
			if class, ok := name["classification"].(map[string]interface{}); ok {
				vuln.Classification = class
			}
			if meta, ok := name["metadata"].(map[string]interface{}); ok {
				vuln.Metadata = meta
			}
		}

		if typ, ok := rawVuln["type"].(string); ok {
			vuln.Type = typ
		}

		if host, ok := rawVuln["host"].(string); ok {
			vuln.Host = host
		}

		if matched, ok := rawVuln["matched-at"].(string); ok {
			vuln.MatchedAt = matched
		} else if matched, ok := rawVuln["matched"].(string); ok {
			vuln.MatchedAt = matched
		}

		if extracted, ok := rawVuln["extracted-results"].([]interface{}); ok {
			for _, e := range extracted {
				if eStr, ok := e.(string); ok {
					vuln.ExtractedResults = append(vuln.ExtractedResults, eStr)
				}
			}
		}

		if ip, ok := rawVuln["ip"].(string); ok {
			vuln.IP = ip
		}

		if timestamp, ok := rawVuln["timestamp"].(string); ok {
			vuln.Timestamp = timestamp
		}

		if curl, ok := rawVuln["curl-command"].(string); ok {
			vuln.CurlCommand = curl
		}

		result.Vulnerabilities = append(result.Vulnerabilities, vuln)
		
		// Update summary
		result.Summary.TotalVulnerabilities++
		if vuln.Severity != "" {
			result.Summary.BySeverity[vuln.Severity]++
		}
		if vuln.Type != "" {
			result.Summary.ByType[vuln.Type]++
		}
	}

	return result
}

// GetResultSummary generates a short summary of the scan result
func (p *NucleiScanProvider) GetResultSummary(result string) string {
	if result == "" {
		return ""
	}

	// Parse the JSON result
	var scanResult NucleiScanResult
	err := json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		// Log the error but return empty string instead of failing
		fmt.Printf("%s [Nuclei] Unable to parse scan results for summary: %v\n", getHostnamePrefix(), err)
		return ""
	}

	total := scanResult.Summary.TotalVulnerabilities
	if total == 0 {
		return "No vulnerabilities found"
	}

	// Count by severity
	critical := scanResult.Summary.BySeverity["critical"]
	high := scanResult.Summary.BySeverity["high"]
	medium := scanResult.Summary.BySeverity["medium"]
	low := scanResult.Summary.BySeverity["low"]

	if critical > 0 {
		return fmt.Sprintf("%d vulnerabilities (%d critical)", total, critical)
	} else if high > 0 {
		return fmt.Sprintf("%d vulnerabilities (%d high)", total, high)
	} else if medium > 0 {
		return fmt.Sprintf("%d vulnerabilities (%d medium)", total, medium)
	} else if low > 0 {
		return fmt.Sprintf("%d vulnerabilities (%d low)", total, low)
	}

	return fmt.Sprintf("%d vulnerabilities found", total)
}
