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

// HttpxHost represents a single host probed by httpx
type HttpxHost struct {
	Timestamp      string   `json:"timestamp,omitempty"`
	Hash           string   `json:"hash,omitempty"`
	Port           string   `json:"port,omitempty"`
	URL            string   `json:"url"`
	Input          string   `json:"input,omitempty"`
	Title          string   `json:"title,omitempty"`
	Scheme         string   `json:"scheme,omitempty"`
	Webserver      string   `json:"webserver,omitempty"`
	ContentType    string   `json:"content_type,omitempty"`
	Method         string   `json:"method,omitempty"`
	Host           string   `json:"host,omitempty"`
	Path           string   `json:"path,omitempty"`
	FavIconMMH3    string   `json:"favicon_mmh3,omitempty"`
	StatusCode     int      `json:"status_code,omitempty"`
	ContentLength  int      `json:"content_length,omitempty"`
	Words          int      `json:"words,omitempty"`
	Lines          int      `json:"lines,omitempty"`
	Failed         bool     `json:"failed,omitempty"`
	TLSData        string   `json:"tls,omitempty"`
	CSPData        string   `json:"csp,omitempty"`
	VHost          bool     `json:"vhost,omitempty"`
	WebSocket      bool     `json:"websocket,omitempty"`
	Technologies   []string `json:"technologies,omitempty"`
	A              []string `json:"a,omitempty"`
	CNAMEs         []string `json:"cname,omitempty"`
	ChainStatusCodes []int  `json:"chain_status_codes,omitempty"`
}

// HttpxScanResult represents the complete httpx scan result
type HttpxScanResult struct {
	Hosts   []HttpxHost   `json:"hosts"`
	Summary HttpxSummary  `json:"summary"`
}

// HttpxSummary provides a summary of the scan results
type HttpxSummary struct {
	TotalHosts     int            `json:"totalHosts"`
	ByStatusCode   map[string]int `json:"byStatusCode"`
	ByScheme       map[string]int `json:"byScheme"`
	WithTech       int            `json:"withTech"`
}

type HttpxScanProvider struct {
	httpxPath string
}

// IsHttpxAvailable checks if httpx is available in the system
// Returns true if httpx is available (either through clientId path or system PATH)
func IsHttpxAvailable(clientId string) bool {
	// If clientId is provided, validate the path exists and is executable
	if clientId != "" {
		// Try to run httpx -version to verify it's executable
		cmd := exec.Command(clientId, "-version")
		err := cmd.Run()
		return err == nil
	}

	// Check if httpx is in system PATH
	_, err := exec.LookPath("httpx")
	return err == nil
}

func NewHttpxScanProvider(clientId string) (*HttpxScanProvider, error) {
	provider := &HttpxScanProvider{
		httpxPath: clientId,
	}

	// If clientId is empty, try to find httpx in system PATH
	if provider.httpxPath == "" {
		httpxPath, err := exec.LookPath("httpx")
		if err != nil {
			return nil, fmt.Errorf("%s httpx not found in system PATH, please specify the path to httpx binary", getHostnamePrefix())
		}
		provider.httpxPath = httpxPath
	}

	return provider, nil
}

func (p *HttpxScanProvider) Scan(target string, command string) (string, error) {
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
		command = "-u %s -json"
	}

	// Validate command to prevent command injection
	command = strings.TrimSpace(command)
	if strings.ContainsAny(command, ";&|`") {
		return "", fmt.Errorf("%s invalid characters in scan command", getHostnamePrefix())
	}

	// Ensure -json flag is present for structured output
	if !strings.Contains(command, "-json") && !strings.Contains(command, "-jsonl") {
		command = command + " -json"
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

	// Run httpx with custom command options
	cmd := exec.Command(p.httpxPath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	fmt.Printf("%s [httpx] Executing httpx scan: %s %s\n", getHostnamePrefix(), p.httpxPath, strings.Join(args, " "))
	err := cmd.Run()
	if err != nil {
		// httpx may return non-zero exit code even when scan completes successfully
		// Check if we got any output
		if stdout.Len() == 0 {
			return "", fmt.Errorf("%s httpx scan failed: %v, stderr: %s", getHostnamePrefix(), err, stderr.String())
		}
		// Log the error but continue with parsing
		fmt.Printf("%s [httpx] Scan completed with warnings: %v\n", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [httpx] Scan completed successfully\n", getHostnamePrefix())

	result := stdout.String()
	if result == "" {
		result = "Scan completed with no hosts found"
	}

	return result, nil
}

func (p *HttpxScanProvider) ParseResult(rawResult string) (string, error) {
	// Parse the JSON output into structured data
	fmt.Printf("%s [httpx] Parsing scan results\n", getHostnamePrefix())

	if rawResult == "" || rawResult == "Scan completed with no hosts found" {
		emptyResult := &HttpxScanResult{
			Hosts: []HttpxHost{},
			Summary: HttpxSummary{
				TotalHosts:   0,
				ByStatusCode: map[string]int{},
				ByScheme:     map[string]int{},
				WithTech:     0,
			},
		}
		jsonBytes, err := json.Marshal(emptyResult)
		if err != nil {
			return "", fmt.Errorf("%s failed to marshal empty httpx result: %v", getHostnamePrefix(), err)
		}
		return string(jsonBytes), nil
	}

	parsedResult := p.parseHttpxOutput(rawResult)

	// Convert to JSON
	jsonBytes, err := json.Marshal(parsedResult)
	if err != nil {
		return "", fmt.Errorf("%s failed to marshal httpx result: %v", getHostnamePrefix(), err)
	}

	hostCount := len(parsedResult.Hosts)
	hostWord := "hosts"
	if hostCount == 1 {
		hostWord = "host"
	}
	fmt.Printf("%s [httpx] Successfully parsed %d %s\n", getHostnamePrefix(), hostCount, hostWord)

	return string(jsonBytes), nil
}

// parseHttpxOutput parses the JSON output from httpx and creates a structured result
func (p *HttpxScanProvider) parseHttpxOutput(output string) *HttpxScanResult {
	result := &HttpxScanResult{
		Hosts: []HttpxHost{},
		Summary: HttpxSummary{
			TotalHosts:   0,
			ByStatusCode: make(map[string]int),
			ByScheme:     make(map[string]int),
			WithTech:     0,
		},
	}

	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse each JSON line
		var host HttpxHost
		err := json.Unmarshal([]byte(line), &host)
		if err != nil {
			// Skip lines that aren't valid JSON
			continue
		}

		result.Hosts = append(result.Hosts, host)

		// Update summary
		result.Summary.TotalHosts++
		
		// Count by status code
		if host.StatusCode > 0 {
			statusCodeStr := fmt.Sprintf("%d", host.StatusCode)
			result.Summary.ByStatusCode[statusCodeStr]++
		}
		
		// Count by scheme
		if host.Scheme != "" {
			result.Summary.ByScheme[host.Scheme]++
		}
		
		// Count hosts with technologies
		if len(host.Technologies) > 0 {
			result.Summary.WithTech++
		}
	}

	return result
}

// GetResultSummary generates a short summary of the scan result
func (p *HttpxScanProvider) GetResultSummary(result string) string {
	if result == "" {
		return ""
	}

	// Parse the JSON result
	var scanResult HttpxScanResult
	err := json.Unmarshal([]byte(result), &scanResult)
	if err != nil {
		// Log the error but return empty string instead of failing
		fmt.Printf("%s [httpx] Unable to parse scan results for summary: %v\n", getHostnamePrefix(), err)
		return ""
	}

	total := scanResult.Summary.TotalHosts
	if total == 0 {
		return "No hosts found"
	}

	hostWord := "hosts"
	if total == 1 {
		hostWord = "host"
	}

	// Count hosts by status code groups
	success := 0
	for statusCode := range scanResult.Summary.ByStatusCode {
		if strings.HasPrefix(statusCode, "2") {
			success += scanResult.Summary.ByStatusCode[statusCode]
		}
	}

	if success > 0 {
		return fmt.Sprintf("%d %s (%d successful)", total, hostWord, success)
	}

	return fmt.Sprintf("%d %s found", total, hostWord)
}
