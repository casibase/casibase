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
	"os"
	"os/exec"
	"strings"
)

// WindowsPatch represents a Windows update patch
type WindowsPatch struct {
	Title                string `json:"title"`
	KB                   string `json:"kb"`
	Size                 string `json:"size"`
	Status               string `json:"status"`
	Description          string `json:"description"`
	RebootRequired       bool   `json:"rebootRequired"`
	InstalledOn          string `json:"installedOn,omitempty"`
	LastSearchTime       string `json:"lastSearchTime,omitempty"`
	Categories           string `json:"categories,omitempty"`
	IsInstalled          bool   `json:"isInstalled"`
	IsDownloaded         bool   `json:"isDownloaded"`
	IsMandatory          bool   `json:"isMandatory"`
	AutoSelectOnWebSites bool   `json:"autoSelectOnWebSites"`
}

type OSPatchScanProvider struct {
}

// NewOSPatchScanProvider creates a new OS Patch scan provider
// clientId parameter is kept for interface compatibility with other scan providers,
// but is not used since OS Patch scanning doesn't require external configuration
func NewOSPatchScanProvider(clientId string) (*OSPatchScanProvider, error) {
	provider := &OSPatchScanProvider{}
	return provider, nil
}

// runPowerShell executes a PowerShell command and returns the output
func (p *OSPatchScanProvider) runPowerShell(command string) (string, error) {
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", command)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("powershell command failed: %v, stderr: %s", err, stderr.String())
	}

	return stdout.String(), nil
}

// extractJSON extracts JSON content from PowerShell output by removing non-JSON lines
func (p *OSPatchScanProvider) extractJSON(output string) string {
	output = strings.TrimSpace(output)
	if output == "" {
		return ""
	}

	lines := strings.Split(output, "\n")
	var jsonLines []string
	inJSON := false

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Start of JSON array or object
		if !inJSON && (strings.HasPrefix(line, "[") || strings.HasPrefix(line, "{")) {
			inJSON = true
		}
		// Collect JSON lines
		if inJSON {
			jsonLines = append(jsonLines, line)
		}
	}

	return strings.Join(jsonLines, "\n")
}

// ListPatches returns all Windows OS patches that need to be updated
func (p *OSPatchScanProvider) ListPatches() ([]*WindowsPatch, error) {
	// Use PSWindowsUpdate to get available updates
	// Note: -Force flag is used to ensure the module is loaded even if it was previously imported
	// This matches the pattern used in the object package's updater
	psCommand := `
		$ErrorActionPreference = 'Stop';
		$ProgressPreference = 'Continue';
		try {
			Import-Module PSWindowsUpdate -Force -ErrorAction Stop;
		} catch {
			Write-Error "PSWindowsUpdate module not found. Please install it using: Install-Module -Name PSWindowsUpdate -Force"
			exit 1
		}
		$updates = Get-WindowsUpdate -MicrosoftUpdate;
		if ($null -eq $updates) {
			Write-Output '[]'
		} else {
			$updates | Select-Object @{Name='Title';Expression={$_.Title}},
				@{Name='KB';Expression={$_.KBArticleIDs -join ','}},
				@{Name='Size';Expression={[math]::Round($_.MaxDownloadSize/1MB, 2).ToString() + ' MB'}},
				@{Name='Status';Expression={
					if ($_.IsDownloaded) { 'Downloaded' }
					elseif ($_.IsInstalled) { 'Installed' }
					else { 'Available' }
				}},
				@{Name='Description';Expression={$_.Description}},
				@{Name='RebootRequired';Expression={$_.RebootRequired}},
				@{Name='Categories';Expression={($_.Categories | ForEach-Object { $_.Name }) -join ','}},
				@{Name='IsInstalled';Expression={$_.IsInstalled}},
				@{Name='IsDownloaded';Expression={$_.IsDownloaded}},
				@{Name='IsMandatory';Expression={$_.IsMandatory}},
				@{Name='AutoSelectOnWebSites';Expression={$_.AutoSelectOnWebSites}} | 
			ConvertTo-Json
		}
	`

	output, err := p.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("failed to list patches: %v", err)
	}

	// Extract JSON from output, removing any non-JSON lines (e.g., interactive prompts)
	output = p.extractJSON(output)

	// Parse JSON output
	var patches []*WindowsPatch
	output = strings.TrimSpace(output)
	if output == "" || output == "null" {
		return []*WindowsPatch{}, nil
	}

	// Handle both single object and array of objects
	if strings.HasPrefix(output, "[") {
		err = json.Unmarshal([]byte(output), &patches)
	} else {
		var patch WindowsPatch
		err = json.Unmarshal([]byte(output), &patch)
		if err == nil {
			patches = []*WindowsPatch{&patch}
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse patches JSON: %v", err)
	}

	return patches, nil
}

func (p *OSPatchScanProvider) Scan(target string) (string, error) {
	// For OS Patch scanning, the target parameter is used as a reference only
	// since we can only scan the local machine. We use the hostname to identify the machine.
	hostname, err := os.Hostname()
	if err != nil {
		return "", fmt.Errorf("failed to get hostname: %v", err)
	}

	// List available patches
	patches, err := p.ListPatches()
	if err != nil {
		return "", fmt.Errorf("failed to list patches: %v", err)
	}

	// Format the result as JSON for better readability
	result := map[string]interface{}{
		"hostname":   hostname,
		"patchCount": len(patches),
		"patches":    patches,
		"scanType":   "OS Patch",
		"scanTarget": target,
	}

	jsonResult, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to format result: %v", err)
	}

	return string(jsonResult), nil
}

func (p *OSPatchScanProvider) ScanWithCommand(target string, command string) (string, error) {
	// For OS Patch scanning, commands are not used, so we just call the regular Scan method
	// The command parameter is ignored but kept for interface compatibility
	return p.Scan(target)
}
