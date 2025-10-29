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

type RmmScanProvider struct {
	baseURL string
	client  *http.Client
}

type RmmUpdateInfo struct {
	UpdateID    string `json:"update_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Installed   bool   `json:"installed"`
	Severity    string `json:"severity"`
}

type RmmUpdateResponse struct {
	Updates []RmmUpdateInfo `json:"updates"`
	Count   int             `json:"count"`
}

func NewRmmScanProvider(baseURL string) (*RmmScanProvider, error) {
	if baseURL == "" {
		return nil, fmt.Errorf("RMM agent base URL cannot be empty")
	}

	// Ensure baseURL has proper format
	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		baseURL = "http://" + baseURL
	}

	// Remove trailing slash
	baseURL = strings.TrimSuffix(baseURL, "/")

	provider := &RmmScanProvider{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}

	return provider, nil
}

func (p *RmmScanProvider) Scan(target string) (string, error) {
	// Default scan: get OS update list
	return p.getUpdateList()
}

func (p *RmmScanProvider) ScanWithCommand(target string, command string) (string, error) {
	command = strings.TrimSpace(command)

	// Support different commands
	switch command {
	case "list", "get-updates", "":
		return p.getUpdateList()
	case "install":
		if target == "" {
			return "", fmt.Errorf("update ID is required for install command")
		}
		return p.installUpdate(target)
	default:
		// Treat command as custom API endpoint
		return p.customRequest(command, target)
	}
}

func (p *RmmScanProvider) getUpdateList() (string, error) {
	url := fmt.Sprintf("%s/api/v1/updates", p.baseURL)

	resp, err := p.client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to get updates from RMM agent: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("RMM agent returned error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse and format the response
	var updateResp RmmUpdateResponse
	if err := json.Unmarshal(body, &updateResp); err != nil {
		// If parsing fails, return raw response
		return string(body), nil
	}

	// Format the response for better readability
	result := fmt.Sprintf("Found %d updates:\n\n", updateResp.Count)
	for i, update := range updateResp.Updates {
		installed := "Not Installed"
		if update.Installed {
			installed = "Installed"
		}
		result += fmt.Sprintf("%d. %s\n", i+1, update.Title)
		result += fmt.Sprintf("   ID: %s\n", update.UpdateID)
		result += fmt.Sprintf("   Status: %s\n", installed)
		result += fmt.Sprintf("   Severity: %s\n", update.Severity)
		if update.Description != "" {
			result += fmt.Sprintf("   Description: %s\n", update.Description)
		}
		result += "\n"
	}

	return result, nil
}

func (p *RmmScanProvider) installUpdate(updateID string) (string, error) {
	// Validate and encode update ID to prevent path traversal
	updateID = strings.TrimSpace(updateID)
	if strings.ContainsAny(updateID, "/\\") {
		return "", fmt.Errorf("invalid update ID: contains path separators")
	}
	encodedID := url.PathEscape(updateID)
	requestURL := fmt.Sprintf("%s/api/v1/updates/%s/install", p.baseURL, encodedID)

	req, err := http.NewRequest("POST", requestURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to install update: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return "", fmt.Errorf("RMM agent returned error (status %d): %s", resp.StatusCode, string(body))
	}

	return fmt.Sprintf("Update %s installation initiated successfully.\nResponse: %s", updateID, string(body)), nil
}

func (p *RmmScanProvider) customRequest(endpoint string, params string) (string, error) {
	// Support custom API endpoints with validation
	endpoint = strings.TrimSpace(endpoint)

	// Validate endpoint doesn't contain dangerous characters
	if strings.ContainsAny(endpoint, ";&|`$") {
		return "", fmt.Errorf("invalid characters in endpoint")
	}

	if !strings.HasPrefix(endpoint, "/") {
		endpoint = "/" + endpoint
	}

	requestURL := fmt.Sprintf("%s%s", p.baseURL, endpoint)
	if params != "" {
		requestURL = fmt.Sprintf("%s?%s", requestURL, params)
	}

	resp, err := p.client.Get(requestURL)
	if err != nil {
		return "", fmt.Errorf("failed to make custom request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("RMM agent returned error (status %d): %s", resp.StatusCode, string(body))
	}

	return string(body), nil
}
