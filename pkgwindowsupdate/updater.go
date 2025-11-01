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

package pkgwindowsupdate

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// Patch represents a Windows update patch
type Patch struct {
	Title                string    `json:"title"`
	KB                   string    `json:"kb"`
	Size                 string    `json:"size"`
	Status               string    `json:"status"`
	Description          string    `json:"description"`
	RebootRequired       bool      `json:"rebootRequired"`
	InstalledOn          time.Time `json:"installedOn,omitempty"`
	LastSearchTime       time.Time `json:"lastSearchTime,omitempty"`
	Categories           []string  `json:"categories,omitempty"`
	IsInstalled          bool      `json:"isInstalled"`
	IsDownloaded         bool      `json:"isDownloaded"`
	IsMandatory          bool      `json:"isMandatory"`
	AutoSelectOnWebSites bool      `json:"autoSelectOnWebSites"`
}

// InstallProgress represents the installation progress of a patch
type InstallProgress struct {
	KB              string    `json:"kb"`
	Status          string    `json:"status"`
	PercentComplete int       `json:"percentComplete"`
	IsComplete      bool      `json:"isComplete"`
	RebootRequired  bool      `json:"rebootRequired"`
	Error           string    `json:"error,omitempty"`
	StartTime       time.Time `json:"startTime"`
	EndTime         time.Time `json:"endTime,omitempty"`
}

// Updater provides Windows Update functionality using PSWindowsUpdate
type Updater struct {
	// Optional configuration can be added here in the future
}

// NewUpdater creates a new Updater instance
func NewUpdater() *Updater {
	return &Updater{}
}

// validateKB validates and sanitizes a KB number to prevent command injection
// Returns the sanitized KB number (without "KB" prefix) or an error
func validateKB(kb string) (string, error) {
	if kb == "" {
		return "", fmt.Errorf("KB number is required")
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

// runPowerShell executes a PowerShell command and returns the output
func (u *Updater) runPowerShell(command string) (string, error) {
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", command)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("powershell command failed: %v, stderr: %s", err, stderr.String())
	}

	return stdout.String(), nil
}

// ListPatches returns all Windows OS patches that need to be updated
func (u *Updater) ListPatches() ([]*Patch, error) {
	// Use PSWindowsUpdate to get available updates
	psCommand := `
		Import-Module PSWindowsUpdate -ErrorAction Stop;
		$updates = Get-WindowsUpdate -MicrosoftUpdate;
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
	`

	output, err := u.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("failed to list patches: %v", err)
	}

	// Parse JSON output
	var patches []*Patch
	output = strings.TrimSpace(output)
	if output == "" || output == "null" {
		return []*Patch{}, nil
	}

	// Handle both single object and array of objects
	if strings.HasPrefix(output, "[") {
		err = json.Unmarshal([]byte(output), &patches)
	} else {
		var patch Patch
		err = json.Unmarshal([]byte(output), &patch)
		if err == nil {
			patches = []*Patch{&patch}
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse patches JSON: %v", err)
	}

	return patches, nil
}

// ListInstalledPatches returns all recently installed patches, including those with "Pending restart" status
func (u *Updater) ListInstalledPatches() ([]*Patch, error) {
	// Use PSWindowsUpdate to get update history
	psCommand := `
		Import-Module PSWindowsUpdate -ErrorAction Stop;
		$history = Get-WUHistory | Select-Object -First 50;
		$rebootPending = Get-WURebootStatus -Silent;
		$history | Select-Object @{Name='Title';Expression={$_.Title}},
			@{Name='KB';Expression={
				if ($_.Title -match 'KB[0-9]+') { $matches[0] }
				else { '' }
			}},
			@{Name='Size';Expression={'N/A'}},
			@{Name='Status';Expression={
				if ($rebootPending) { 'Pending Restart' }
				else { $_.Result }
			}},
			@{Name='Description';Expression={$_.Description}},
			@{Name='RebootRequired';Expression={$rebootPending}},
			@{Name='InstalledOn';Expression={$_.Date}},
			@{Name='IsInstalled';Expression={$true}},
			@{Name='IsDownloaded';Expression={$true}},
			@{Name='IsMandatory';Expression={$false}},
			@{Name='AutoSelectOnWebSites';Expression={$false}} | 
		ConvertTo-Json
	`

	output, err := u.runPowerShell(psCommand)
	if err != nil {
		return nil, fmt.Errorf("failed to list installed patches: %v", err)
	}

	// Parse JSON output
	var patches []*Patch
	output = strings.TrimSpace(output)
	if output == "" || output == "null" {
		return []*Patch{}, nil
	}

	// Handle both single object and array of objects
	if strings.HasPrefix(output, "[") {
		err = json.Unmarshal([]byte(output), &patches)
	} else {
		var patch Patch
		err = json.Unmarshal([]byte(output), &patch)
		if err == nil {
			patches = []*Patch{&patch}
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to parse installed patches JSON: %v", err)
	}

	return patches, nil
}

// InstallPatch installs a specific patch by KB number
func (u *Updater) InstallPatch(kb string) (*InstallProgress, error) {
	// Validate and sanitize KB number to prevent command injection
	sanitizedKB, err := validateKB(kb)
	if err != nil {
		return nil, err
	}
	kb = sanitizedKB

	progress := &InstallProgress{
		KB:              kb,
		Status:          "Starting",
		PercentComplete: 0,
		IsComplete:      false,
		StartTime:       time.Now(),
	}

	// Install the patch using PSWindowsUpdate
	// Note: KB number has been validated to contain only digits, preventing command injection
	psCommand := fmt.Sprintf(`
		Import-Module PSWindowsUpdate -ErrorAction Stop;
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

	output, err := u.runPowerShell(psCommand)
	if err != nil {
		progress.Status = "Failed"
		progress.Error = err.Error()
		progress.IsComplete = true
		progress.EndTime = time.Now()
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
			progress.EndTime = time.Now()
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
	progress.EndTime = time.Now()

	return progress, nil
}

// MonitorInstallProgress monitors the installation progress of a patch
// This function polls the Windows Update service to check installation status
func (u *Updater) MonitorInstallProgress(kb string, intervalSeconds int) (<-chan *InstallProgress, error) {
	// Validate and sanitize KB number to prevent command injection
	sanitizedKB, err := validateKB(kb)
	if err != nil {
		return nil, err
	}
	kb = sanitizedKB

	if intervalSeconds <= 0 {
		intervalSeconds = 5
	}

	progressChan := make(chan *InstallProgress, 10)

	go func() {
		defer close(progressChan)

		startTime := time.Now()
		ticker := time.NewTicker(time.Duration(intervalSeconds) * time.Second)
		defer ticker.Stop()

		for {
			progress := &InstallProgress{
				KB:              kb,
				Status:          "Installing",
				PercentComplete: 0,
				IsComplete:      false,
				StartTime:       startTime,
			}

			// Check if the update is still installing
			// Note: KB number has been validated to contain only digits, preventing command injection
			psCommand := fmt.Sprintf(`
				Import-Module PSWindowsUpdate -ErrorAction Stop;
				$history = Get-WUHistory | Where-Object { $_.Title -match 'KB%s' } | Select-Object -First 1;
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

			output, err := u.runPowerShell(psCommand)
			if err != nil {
				progress.Status = "Error"
				progress.Error = err.Error()
				progress.IsComplete = true
				progress.EndTime = time.Now()
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
				progress.EndTime = time.Now()
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
