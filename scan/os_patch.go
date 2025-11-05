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
	PatchId         string `json:"patchId"`
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
			return "", fmt.Errorf("%s failed to list available patches: %v", getHostnamePrefix(), err1)
		}
		if err2 != nil {
			return "", fmt.Errorf("%s failed to list installed patches: %v", getHostnamePrefix(), err2)
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
		return "", fmt.Errorf("%s failed to marshal patches: %v", getHostnamePrefix(), err)
	}

	return string(result), nil
}

// ParseResult implements the ScanProvider interface for OS patch scanning
// For OS patches, the raw result is already in JSON format, so this just returns it as-is
func (p *OsPatchScanProvider) ParseResult(rawResult string) (string, error) {
	return rawResult, nil
}

// validatePatchId validates and sanitizes a patch ID to prevent command injection
// If the patch ID looks like a KB number, it validates it as such
// Otherwise, it validates it as a title
// Returns the sanitized patch ID and whether it's a KB number
func validatePatchId(patchId string) (string, bool, error) {
	if patchId == "" {
		return "", false, fmt.Errorf("%s patch ID is required", getHostnamePrefix())
	}

	// Check if it looks like a KB number (digits or KB followed by digits)
	kbPattern := regexp.MustCompile(`^(?:KB)?([0-9]+)$`)
	if matches := kbPattern.FindStringSubmatch(strings.ToUpper(patchId)); len(matches) > 1 {
		// It's a KB number - return just the digits
		return matches[1], true, nil
	}

	// It's a title - validate it doesn't contain dangerous characters
	// Allow alphanumeric, spaces, and common punctuation (but not path separators or command injection chars)
	titlePattern := regexp.MustCompile(`^[a-zA-Z0-9\s\-_.,()]+$`)
	if !titlePattern.MatchString(patchId) {
		return "", false, fmt.Errorf("%s invalid patch ID format: contains unsafe characters", getHostnamePrefix())
	}

	return patchId, false, nil
}

// runPowerShell executes a PowerShell command and returns the output
// The output encoding is forced to UTF-8 to handle non-English Windows systems correctly
func (p *OsPatchScanProvider) runPowerShell(command string) (string, error) {
	// Wrap the command to set output encoding to UTF-8
	// This ensures proper handling of non-ASCII characters on systems with different default encodings
	wrappedCommand := fmt.Sprintf("[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; %s", command)
	
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", wrappedCommand)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("%s powershell command failed: %v, stderr: %s", getHostnamePrefix(), err, stderr.String())
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

// ListPatches returns all Windows OS patches from local cache
// This uses Get-WUHistory API for faster scanning without online searches
func (p *OsPatchScanProvider) ListPatches() ([]*WindowsPatch, error) {
	// Use Get-WUHistory to get update information from local cache only
	// This is much faster than Get-WindowsUpdate which searches online
	// Returns up to 500 most recent updates from Windows Update history
	psCommand := `
		$ErrorActionPreference = 'Stop';
		$ProgressPreference = 'Continue';
		Import-Module PSWindowsUpdate -Force;
		$updates = Get-WUHistory -Last 500;
		if ($null -eq $updates) {
			Write-Output '[]'
		} else {
			$updates | Select-Object @{Name='Title';Expression={$_.Title}},
				@{Name='KB';Expression={
					if ($_.Title -match 'KB[0-9]+') { $matches[0] }
					else { '' }
				}},
				@{Name='Size';Expression={'N/A'}},
				@{Name='Status';Expression={
					if ($_.Result -eq 'Succeeded') { 'Installed' }
					elseif ($_.Result -eq 'Failed') { 'Failed' }
					elseif ($_.Result -eq 'InProgress') { 'Installing' }
					else { $_.Result }
				}},
				@{Name='Description';Expression={$_.Description}},
				@{Name='RebootRequired';Expression={$false}},
				@{Name='Categories';Expression={''}},
				@{Name='IsInstalled';Expression={$_.Result -eq 'Succeeded'}},
				@{Name='IsDownloaded';Expression={$true}},
				@{Name='IsMandatory';Expression={$false}},
				@{Name='AutoSelectOnWebSites';Expression={$false}} | 
			ConvertTo-Json
		}
	`

	fmt.Printf("%s [OS Patch] Executing PowerShell command:\n%s\n", getHostnamePrefix(), psCommand)
	output, err := p.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("%s failed to list patches: %v", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [OS Patch] PowerShell output:\n%s\n", getHostnamePrefix(), output)

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
		return nil, fmt.Errorf("%s failed to parse patches JSON: %v", getHostnamePrefix(), err)
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

	fmt.Printf("%s [OS Patch] Executing PowerShell command:\n%s\n", getHostnamePrefix(), psCommand)
	output, err := p.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("%s failed to list installed patches: %v", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [OS Patch] PowerShell output:\n%s\n", getHostnamePrefix(), output)

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
		return nil, fmt.Errorf("%s failed to parse installed patches JSON: %v", getHostnamePrefix(), err)
	}

	return patches, nil
}

// InstallPatch installs a specific patch by patch ID (KB number or title)
func (p *OsPatchScanProvider) InstallPatch(patchId string) (*InstallProgress, error) {
	// Validate and sanitize patch ID to prevent command injection
	sanitizedPatchId, isKB, err := validatePatchId(patchId)
	if err != nil {
		return nil, err
	}

	progress := &InstallProgress{
		PatchId:         patchId,
		Status:          "Starting",
		PercentComplete: 0,
		IsComplete:      false,
		StartTime:       time.Now().Format(time.RFC3339),
	}

	var psCommand string
	if isKB {
		// Install by KB number
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
	`, sanitizedPatchId, sanitizedPatchId)
	} else {
		// Install by title - escape for PowerShell
		// Escape single quotes, backticks, and dollar signs which are special in PowerShell
		escapedTitle := strings.ReplaceAll(sanitizedPatchId, "`", "``")
		escapedTitle = strings.ReplaceAll(escapedTitle, "'", "''")
		escapedTitle = strings.ReplaceAll(escapedTitle, "$", "`$")
		psCommand = fmt.Sprintf(`
		$ErrorActionPreference = 'Stop';
		$ProgressPreference = 'Continue';
		Import-Module PSWindowsUpdate -Force;
		$updates = Get-WindowsUpdate -MicrosoftUpdate | Where-Object { $_.Title -eq '%s' };
		if ($updates) {
			$result = $updates | Install-WindowsUpdate -AcceptAll -IgnoreReboot -Confirm:$false -Verbose;
			if ($result) {
				$result | Select-Object @{Name='Status';Expression={$_.Result}},
					@{Name='RebootRequired';Expression={$_.RebootRequired}},
					@{Name='Title';Expression={$_.Title}} | 
				ConvertTo-Json
			} else {
				@{Status='NotFound'; RebootRequired=$false; Title='%s'} | ConvertTo-Json
			}
		} else {
			@{Status='NotFound'; RebootRequired=$false; Title='%s'} | ConvertTo-Json
		}
	`, escapedTitle, escapedTitle, escapedTitle)
	}

	fmt.Printf("%s [OS Patch] Executing PowerShell command:\n%s\n", getHostnamePrefix(), psCommand)
	output, err := p.runPowerShell(psCommand)
	if err != nil {
		progress.Status = "Failed"
		progress.Error = err.Error()
		progress.IsComplete = true
		progress.EndTime = time.Now().Format(time.RFC3339)
		return progress, fmt.Errorf("%s failed to install patch: %v", getHostnamePrefix(), err)
	}
	fmt.Printf("%s [OS Patch] PowerShell output:\n%s\n", getHostnamePrefix(), output)

	// Parse the result
	var result map[string]interface{}
	output = strings.TrimSpace(output)
	if output != "" && output != "null" {
		err = json.Unmarshal([]byte(output), &result)
		if err != nil {
			progress.Status = "Failed"
			progress.Error = fmt.Sprintf("%s failed to parse result: %v", getHostnamePrefix(), err)
			progress.IsComplete = true
			progress.EndTime = time.Now().Format(time.RFC3339)
			return progress, fmt.Errorf("%s failed to parse install result: %v", getHostnamePrefix(), err)
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
func (p *OsPatchScanProvider) MonitorInstallProgress(patchId string, intervalSeconds int) (<-chan *InstallProgress, error) {
	// Validate and sanitize patch ID to prevent command injection
	sanitizedPatchId, isKB, err := validatePatchId(patchId)
	if err != nil {
		return nil, err
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
				PatchId:         patchId,
				Status:          "Installing",
				PercentComplete: 0,
				IsComplete:      false,
				StartTime:       startTime,
			}

			var psCommand string
			if isKB {
				// Check progress by KB number using only local cache (Get-WUHistory)
				psCommand = fmt.Sprintf(`
				$ErrorActionPreference = 'Stop';
				$ProgressPreference = 'Continue';
				Import-Module PSWindowsUpdate -Force;
				$history = Get-WUHistory -ErrorAction SilentlyContinue | Where-Object { $_.Title -match 'KB%s' } | Select-Object -First 1;
				
				if ($history -and $history.Result -eq 'Succeeded') {
					@{Status='Completed'; PercentComplete=100; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
				} elseif ($history -and $history.Result -eq 'Failed') {
					@{Status='Failed'; PercentComplete=0; IsComplete=$true; RebootRequired=$false; Error=$history.Title} | ConvertTo-Json
				} elseif ($history -and $history.Result -eq 'InProgress') {
					@{Status='Installing'; PercentComplete=50; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
				} elseif ($history) {
					@{Status='Installing'; PercentComplete=25; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
				} else {
					@{Status='NotFound'; PercentComplete=0; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
				}
			`, sanitizedPatchId)
			} else {
				// Check progress by title using only local cache (Get-WUHistory)
				// Escape single quotes, backticks, and dollar signs which are special in PowerShell
				escapedTitle := strings.ReplaceAll(sanitizedPatchId, "`", "``")
				escapedTitle = strings.ReplaceAll(escapedTitle, "'", "''")
				escapedTitle = strings.ReplaceAll(escapedTitle, "$", "`$")
				psCommand = fmt.Sprintf(`
				$ErrorActionPreference = 'Stop';
				$ProgressPreference = 'Continue';
				Import-Module PSWindowsUpdate -Force;
				$history = Get-WUHistory -ErrorAction SilentlyContinue | Where-Object { $_.Title -eq '%s' } | Select-Object -First 1;
				
				if ($history -and $history.Result -eq 'Succeeded') {
					@{Status='Completed'; PercentComplete=100; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
				} elseif ($history -and $history.Result -eq 'Failed') {
					@{Status='Failed'; PercentComplete=0; IsComplete=$true; RebootRequired=$false; Error=$history.Title} | ConvertTo-Json
				} elseif ($history -and $history.Result -eq 'InProgress') {
					@{Status='Installing'; PercentComplete=50; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
				} elseif ($history) {
					@{Status='Installing'; PercentComplete=25; IsComplete=$false; RebootRequired=$false} | ConvertTo-Json
				} else {
					@{Status='NotFound'; PercentComplete=0; IsComplete=$true; RebootRequired=$false} | ConvertTo-Json
				}
			`, escapedTitle)
			}

			fmt.Printf("%s [OS Patch] Executing PowerShell command:\n%s\n", getHostnamePrefix(), psCommand)
			output, err := p.runPowerShell(psCommand)
			if err != nil {
				progress.Status = "Error"
				progress.Error = err.Error()
				progress.IsComplete = true
				progress.EndTime = time.Now().Format(time.RFC3339)
				progressChan <- progress
				return
			}
			fmt.Printf("%s [OS Patch] PowerShell output:\n%s\n", getHostnamePrefix(), output)

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
