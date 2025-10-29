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
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// RmmScanProvider provides integration with Tactical RMM agents for remote system management.
// It supports getting OS updates, system information, and installing updates.
//
// Example usage:
//   provider, err := NewRmmScanProvider("http://rmm-server:8000", "your-api-key")
//   if err != nil {
//       // handle error
//   }
//   result, err := provider.Scan("agent-123")
//   // result will contain JSON with updates list and system info
type RmmScanProvider struct {
	apiUrl string
	apiKey string
	client *http.Client
}

// RmmUpdateInfo represents OS update information
type RmmUpdateInfo struct {
	UpdateID    string `json:"update_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	IsInstalled bool   `json:"is_installed"`
}

// RmmScanResult represents the scan result
type RmmScanResult struct {
	AgentID   string          `json:"agent_id"`
	Hostname  string          `json:"hostname"`
	OS        string          `json:"os"`
	Updates   []RmmUpdateInfo `json:"updates"`
	Status    string          `json:"status"`
	Timestamp string          `json:"timestamp"`
}

func NewRmmScanProvider(clientId string, clientSecret string) (*RmmScanProvider, error) {
	if clientId == "" {
		return nil, fmt.Errorf("RMM API URL (clientId) cannot be empty")
	}

	// Validate URL format
	parsedURL, err := url.Parse(clientId)
	if err != nil {
		return nil, fmt.Errorf("invalid RMM API URL: %v", err)
	}
	if parsedURL.Scheme == "" || parsedURL.Host == "" {
		return nil, fmt.Errorf("invalid RMM API URL: must include scheme (http/https) and host")
	}

	provider := &RmmScanProvider{
		apiUrl: clientId,
		apiKey: clientSecret,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	return provider, nil
}

// validateInput validates and sanitizes input strings to prevent injection attacks
func validateInput(input string) (string, error) {
	input = strings.TrimSpace(input)
	if strings.ContainsAny(input, ";&|`$") {
		return "", fmt.Errorf("invalid characters in input")
	}
	return input, nil
}

func (p *RmmScanProvider) Scan(target string) (string, error) {
	if target == "" {
		return "", fmt.Errorf("scan target (agent ID) cannot be empty")
	}

	// Validate target to prevent injection
	var err error
	target, err = validateInput(target)
	if err != nil {
		return "", fmt.Errorf("invalid scan target: %v", err)
	}

	// Get OS updates from RMM agent
	updates, err := p.getOSUpdates(target)
	if err != nil {
		return "", fmt.Errorf("failed to get OS updates: %v", err)
	}

	// Get system info
	systemInfo, err := p.getSystemInfo(target)
	if err != nil {
		// Continue even if system info fails, we still have updates
		systemInfo = map[string]interface{}{
			"error": err.Error(),
		}
	}

	// Build scan result
	result := RmmScanResult{
		AgentID:   target,
		Updates:   updates,
		Status:    "completed",
		Timestamp: time.Now().Format(time.RFC3339),
	}

	if hostname, ok := systemInfo["hostname"].(string); ok {
		result.Hostname = hostname
	}
	if osInfo, ok := systemInfo["os"].(string); ok {
		result.OS = osInfo
	}

	// Convert result to JSON string
	resultJSON, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal scan result: %v", err)
	}

	return string(resultJSON), nil
}

func (p *RmmScanProvider) getOSUpdates(agentID string) ([]RmmUpdateInfo, error) {
	// Build request URL with proper URL encoding
	requestURL := fmt.Sprintf("%s/api/v1/agents/%s/updates", p.apiUrl, url.PathEscape(agentID))

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add API key if provided
	if p.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Token %s", p.apiKey))
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned error status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var updates []RmmUpdateInfo
	if err := json.Unmarshal(body, &updates); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return updates, nil
}

func (p *RmmScanProvider) getSystemInfo(agentID string) (map[string]interface{}, error) {
	// Build request URL with proper URL encoding
	requestURL := fmt.Sprintf("%s/api/v1/agents/%s", p.apiUrl, url.PathEscape(agentID))

	req, err := http.NewRequest("GET", requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Add API key if provided
	if p.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Token %s", p.apiKey))
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned error status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var systemInfo map[string]interface{}
	if err := json.Unmarshal(body, &systemInfo); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return systemInfo, nil
}

// InstallUpdate installs a specific update on the agent
func (p *RmmScanProvider) InstallUpdate(agentID string, updateID string) error {
	if agentID == "" || updateID == "" {
		return fmt.Errorf("agentID and updateID cannot be empty")
	}

	// Validate inputs to prevent injection
	var err error
	agentID, err = validateInput(agentID)
	if err != nil {
		return fmt.Errorf("invalid agentID: %v", err)
	}
	updateID, err = validateInput(updateID)
	if err != nil {
		return fmt.Errorf("invalid updateID: %v", err)
	}

	// Build request URL with proper URL encoding
	requestURL := fmt.Sprintf("%s/api/v1/agents/%s/updates/%s/install", p.apiUrl, url.PathEscape(agentID), url.PathEscape(updateID))

	req, err := http.NewRequest("POST", requestURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	// Add API key if provided
	if p.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Token %s", p.apiKey))
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("API returned error status %d", resp.StatusCode)
	}

	return nil
}
