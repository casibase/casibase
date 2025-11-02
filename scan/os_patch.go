// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
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
	"regexp"
	"strings"
	"time"
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

// InstallProgress represents the installation progress of a patch
type InstallProgress struct {
	KB              string `json:"kb"`
	Title           string `json:"title,omitempty"`
	Status          string `json:"status"`
	PercentComplete int    `json:"percentComplete"`
	IsComplete      bool   `json:"isComplete"`
	RebootRequired  bool   `json:"rebootRequired"`
	Error           string `json:"error,omitempty"`
	StartTime       string `json:"startTime"`
	EndTime         string `json:"endTime,omitempty"`
}

// OsPatchScanProvider provides Windows Update functionality using PSWindowsUpdate
type OsPatchScanProvider struct {
	// Optional configuration can be added here in the future
}

// NewOsPatchScanProvider creates a new OsPatchScanProvider instance
func NewOsPatchScanProvider(clientId string) (*OsPatchScanProvider, error) {
	return &OsPatchScanProvider{}, nil
}

// Scan implements the ScanProvider interface for OS patch scanning
// The command parameter specifies the scan type: "available", "installed", or "all"
// The target parameter is not used for OS patch scanning as it scans the local system
func (p *OsPatchScanProvider) Scan(target string, command string) (string, error) {
	command = strings.TrimSpace(strings.ToLower(command))

	var patches []*WindowsPatch
	var err error

	if command == "installed" {
		patches, err = p.ListInstalledPatches()
	} else if command == "all" {
		// Get both available and installed patches
		availablePatches, err1 := p.ListPatches()
		installedPatches, err2 := p.ListInstalledPatches()

		if err1 != nil {
			return "", fmt.Errorf("failed to list available patches: %v", err1)
		}
		if err2 != nil {
			return "", fmt.Errorf("failed to list installed patches: %v", err2)
		}

		// Combine patches: available first, then installed
		patches = append(availablePatches, installedPatches...)
	} else {
		// Default to available patches
		patches, err = p.ListPatches()
	}

	if err != nil {
		return "", err
	}

	// Convert patches to JSON string
	result, err := json.Marshal(patches)
	if err != nil {
		return "", fmt.Errorf("failed to marshal patches: %v", err)
	}

	return string(result), nil
}

// ParseResult implements the ScanProvider interface for OS patch scanning
// For OS patches, the raw result is already in JSON format, so this just returns it as-is
func (p *OsPatchScanProvider) ParseResult(rawResult string) (string, error) {
	return rawResult, nil
}

// validateKB validates and sanitizes a KB number to prevent command injection
// Returns the sanitized KB number (without "KB" prefix) or an error.
// If KB is empty, returns empty string without error (for patches without KB).
func validateKB(kb string) (string, error) {
	if kb == "" {
		return "", nil
	}

	// Remove "KB" prefix if present
	kb = strings.TrimPrefix(strings.ToUpper(kb), "KB")

	// KB numbers should only contain digits
	matched, err := regexp.MatchString("^[0-9]+$", kb)
	if err != nil {
		return "", fmt.Errorf("failed to validate KB number: %v", err)
	}
	if !matched {
		return "", fmt.Errorf("invalid KB number format: must contain only digits")
	}

	return kb, nil
}

// validateTitle validates and sanitizes a patch title to prevent command injection
// Returns the sanitized title or an error
func validateTitle(title string) (string, error) {
	if title == "" {
		return "", fmt.Errorf("title is required when KB is not provided")
	}

	// Prevent command injection by escaping single quotes
	// Replace single quote with two single quotes (PowerShell escape sequence)
	title = strings.ReplaceAll(title, "'", "''")

	return title, nil
}

// runPowerShell executes a PowerShell command and returns the output
func (p *OsPatchScanProvider) runPowerShell(command string) (string, error) {
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
// This handles cases where PowerShell commands output interactive prompts or other text before JSON
func extractJSON(output string) string {
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
func (p *OsPatchScanProvider) ListPatches() ([]*WindowsPatch, error) {
	// Use PSWindowsUpdate to get available updates
	psCommand := `
		$ErrorActionPreference = 'Stop';
		$ProgressPreference = 'Continue';
		Import-Module PSWindowsUpdate -Force;
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
	output = extractJSON(output)

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

// ListInstalledPatches returns all recently installed patches, including those with "Pending restart" status
func (p *OsPatchScanProvider) ListInstalledPatches() ([]*WindowsPatch, error) {
	// Use PSWindowsUpdate to get update history
	// Based on reference implementation that uses proper error handling
	psCommand := `
		$ErrorActionPreference = 'Stop';
		$ProgressPreference = 'Continue';
		Import-Module PSWindowsUpdate -Force;
		$history = Get-WUHistory -Last 50 -ErrorAction SilentlyContinue;
		$rebootPending = $null;
		try { $rebootPending = Get-WURebootStatus -ErrorAction Stop } catch { $rebootPending = $null };
		$isRebootRequired = if ($null -ne $rebootPending) { $rebootPending.IsRebootRequired } else { $false };
		if ($null -eq $history) {
			Write-Output '[]'
		} else {
			$history | Select-Object @{Name='Title';Expression={$_.Title}},
				@{Name='KB';Expression={
					if ($_.Title -match 'KB[0-9]+') { $matches[0] }
					else { '' }
				}},
				@{Name='Size';Expression={'N/A'}},
				@{Name='Status';Expression={
					if ($isRebootRequired) { 'Pending Restart' }
					else { $_.Result }
				}},
				@{Name='Description';Expression={$_.Description}},
				@{Name='RebootRequired';Expression={$isRebootRequired}},
				@{Name='InstalledOn';Expression={$_.Date.ToString('o')}},
				@{Name='IsInstalled';Expression={$true}},
				@{Name='IsDownloaded';Expression={$true}},
				@{Name='IsMandatory';Expression={$false}},
				@{Name='AutoSelectOnWebSites';Expression={$false}} | 
			ConvertTo-Json
		}
	`

	output, err := p.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("failed to list installed patches: %v", err)
	}

	// Extract JSON from output, removing any non-JSON lines (e.g., interactive prompts)
	output = extractJSON(output)

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
		return nil, fmt.Errorf("failed to parse installed patches JSON: %v", err)
	}

	return patches, nil
}

// InstallPatch installs a specific patch by KB number or Title
// If kb is provided, it will be used; otherwise, title must be provided
func (p *OsPatchScanProvider) InstallPatch(kb string, title string) (*InstallProgress, error) {
	// Validate and sanitize KB number to prevent command injection
	sanitizedKB, err := validateKB(kb)
	if err != nil {
		return nil, err
	}
	kb = sanitizedKB

	// If no KB is provided, validate and use title
	var sanitizedTitle string
	if kb == "" {
		sanitizedTitle, err = validateTitle(title)
		if err != nil {
			return nil, err
		}
		title = sanitizedTitle
	}

	progress := &InstallProgress{
		KB:              kb,
		Title:           title,
		Status:          "Starting",
		PercentComplete: 0,
		IsComplete:      false,
		StartTime:       time.Now().Format(time.RFC3339),
	}

	var psCommand string
	if kb != "" {
		// Install by KB number
		// Note: KB number has been validated to contain only digits, preventing command injection
		psCommand = fmt.Sprintf(`
			$ErrorActionPreference = 'Stop';
			$ProgressPreference = 'Continue';
			Import-Module PSWindowsUpdate -Force;
			$result = Install-WindowsUpdate -KBArticleID '%s' -AcceptAll -IgnoreReboot -Confirm:$false -Verbose;
			if ($result) {
				$result | Select-Object @{Name='Status';Expression={$_.Result}},
					@{Name='RebootRequired';Expression={$_.RebootRequired}},
					@{Name='KB';Expression={$_.KB}} | 
				ConvertTo-Json
			} else {
				@{Status='NotFound'; RebootRequired=$false; KB='%s'} | ConvertTo-Json
			}
		`, kb, kb)
	} else {
		// Install by Title
		// Note: Title has been sanitized by escaping single quotes, preventing command injection
		psCommand = fmt.Sprintf(`
			$ErrorActionPreference = 'Stop';
			$ProgressPreference = 'Continue';
			Import-Module PSWindowsUpdate -Force;
			$result = Install-WindowsUpdate -Title '%s' -AcceptAll -IgnoreReboot -Confirm:$false -Verbose;
			if ($result) {
				$result | Select-Object @{Name='Status';Expression={$_.Result}},
					@{Name='RebootRequired';Expression={$_.RebootRequired}},
					@{Name='KB';Expression={$_.KB}},
					@{Name='Title';Expression={$_.Title}} | 
				ConvertTo-Json
			} else {
				@{Status='NotFound'; RebootRequired=$false; Title='%s'} | ConvertTo-Json
			}
		`, title, title)
	}

	output, err := p.runPowerShell(psCommand)
	if err != nil {
		progress.Status = "Failed"
		progress.Error = err.Error()
		progress.IsComplete = true
		progress.EndTime = time.Now().Format(time.RFC3339)
		return progress, fmt.Errorf("failed to install patch: %v", err)
	}

	// Parse the result
	var result map[string]interface{}
	output = strings.TrimSpace(output)
	if output != "" && output != "null" {
		err = json.Unmarshal([]byte(output), &result)
		if err != nil {
			progress.Status = "Failed"
			progress.Error = fmt.Sprintf("failed to parse result: %v", err)
			progress.IsComplete = true
			progress.EndTime = time.Now().Format(time.RFC3339)
			return progress, fmt.Errorf("failed to parse install result: %v", err)
		}

		if status, ok := result["Status"].(string); ok {
			progress.Status = status
		}
		if reboot, ok := result["RebootRequired"].(bool); ok {
			progress.RebootRequired = reboot
		}
	}

	progress.PercentComplete = 100
	progress.IsComplete = true
	progress.EndTime = time.Now().Format(time.RFC3339)

	return progress, nil
}

// MonitorInstallProgress monitors the installation progress of a patch
// This function polls the Windows Update service to check installation status
// If kb is provided, it will be used; otherwise, title must be provided
func (p *OsPatchScanProvider) MonitorInstallProgress(kb string, title string, intervalSeconds int) (<-chan *InstallProgress, error) {
	// Validate and sanitize KB number to prevent command injection
	sanitizedKB, err := validateKB(kb)
	if err != nil {
		return nil, err
	}
	kb = sanitizedKB

	// If no KB is provided, validate and use title
	var sanitizedTitle string
	if kb == "" {
		sanitizedTitle, err = validateTitle(title)
		if err != nil {
			return nil, err
		}
		title = sanitizedTitle
	}

	if intervalSeconds <= 0 {
		intervalSeconds = 5
	}

	progressChan := make(chan *InstallProgress, 10)

	go func() {
		defer close(progressChan)

		startTime := time.Now().Format(time.RFC3339)
		ticker := time.NewTicker(time.Duration(intervalSeconds) * time.Second)
		defer ticker.Stop()

		for {
			progress := &InstallProgress{
				KB:              kb,
				Title:           title,
				Status:          "Installing",
				PercentComplete: 0,
				IsComplete:      false,
				StartTime:       startTime,
			}

			var psCommand string
			if kb != "" {
				// Monitor by KB number
				// Note: KB number has been validated to contain only digits, preventing command injection
				psCommand = fmt.Sprintf(`
					$ErrorActionPreference = 'Stop';
					$ProgressPreference = 'Continue';
					Import-Module PSWindowsUpdate -Force;
					$history = Get-WUHistory -ErrorAction SilentlyContinue | Where-Object { $_.Title -match 'KB%s' } | Select-Object -First 1;
					$installing = Get-WindowsUpdate -KBArticleID '%s' -MicrosoftUpdate;
					
					if ($history -and $history.Result -eq 'Succeeded') {
						@{Status='Completed'; PercentComplete=100; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
					} elseif ($history -and $history.Result -eq 'Failed') {
						@{Status='Failed'; PercentComplete=0; IsComplete=$true; RebootRequired=$false; Error=$history.Title} | ConvertTo-Json
					} elseif ($installing) {
						@{Status='Installing'; PercentComplete=50; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
					} else {
						@{Status='NotFound'; PercentComplete=0; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
					}
				`, kb, kb)
			} else {
				// Monitor by Title
				// Note: Title has been sanitized by escaping single quotes, preventing command injection
				psCommand = fmt.Sprintf(`
					$ErrorActionPreference = 'Stop';
					$ProgressPreference = 'Continue';
					Import-Module PSWindowsUpdate -Force;
					$history = Get-WUHistory -ErrorAction SilentlyContinue | Where-Object { $_.Title -eq '%s' } | Select-Object -First 1;
					$installing = Get-WindowsUpdate -Title '%s' -MicrosoftUpdate;
					
					if ($history -and $history.Result -eq 'Succeeded') {
						@{Status='Completed'; PercentComplete=100; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
					} elseif ($history -and $history.Result -eq 'Failed') {
						@{Status='Failed'; PercentComplete=0; IsComplete=$true; RebootRequired=$false; Error=$history.Title} | ConvertTo-Json
					} elseif ($installing) {
						@{Status='Installing'; PercentComplete=50; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
					} else {
						@{Status='NotFound'; PercentComplete=0; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
					}
				`, title, title)
			}

			output, err := p.runPowerShell(psCommand)
			if err != nil {
				progress.Status = "Error"
				progress.Error = err.Error()
				progress.IsComplete = true
				progress.EndTime = time.Now().Format(time.RFC3339)
				progressChan <- progress
				return
			}

			// Parse the result
			var result map[string]interface{}
			output = strings.TrimSpace(output)
			if output != "" && output != "null" {
				err = json.Unmarshal([]byte(output), &result)
				if err == nil {
					if status, ok := result["Status"].(string); ok {
						progress.Status = status
					}
					if percent, ok := result["PercentComplete"].(float64); ok {
						progress.PercentComplete = int(percent)
					}
					if isComplete, ok := result["IsComplete"].(bool); ok {
						progress.IsComplete = isComplete
					}
					if reboot, ok := result["RebootRequired"].(bool); ok {
						progress.RebootRequired = reboot
					}
					if errMsg, ok := result["Error"].(string); ok {
						progress.Error = errMsg
					}
				}
			}

			if progress.IsComplete {
				progress.EndTime = time.Now().Format(time.RFC3339)
			}

			progressChan <- progress

			if progress.IsComplete {
				return
			}

			<-ticker.C
		}
	}()

	return progressChan, nil
}
