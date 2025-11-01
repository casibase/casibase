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

package pkgwindowsupdate

import (
	"fmt"
	"runtime"
	"testing"
	"time"
)

// TestListPatches tests listing available Windows updates
func TestListPatches(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	updater := NewUpdater()
	patches, err := updater.ListPatches()
	if err != nil {
		t.Fatalf("Failed to list patches: %v", err)
	}

	t.Logf("Found %d available patches", len(patches))
	for i, patch := range patches {
		t.Logf("Patch %d:", i+1)
		t.Logf("  Title: %s", patch.Title)
		t.Logf("  KB: %s", patch.KB)
		t.Logf("  Size: %s", patch.Size)
		t.Logf("  Status: %s", patch.Status)
		t.Logf("  IsInstalled: %v", patch.IsInstalled)
		t.Logf("  IsDownloaded: %v", patch.IsDownloaded)
		t.Logf("  IsMandatory: %v", patch.IsMandatory)
		t.Logf("  RebootRequired: %v", patch.RebootRequired)
		if len(patch.Categories) > 0 {
			t.Logf("  Categories: %v", patch.Categories)
		}
	}
}

// TestListInstalledPatches tests listing installed Windows updates
func TestListInstalledPatches(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	updater := NewUpdater()
	patches, err := updater.ListInstalledPatches()
	if err != nil {
		t.Fatalf("Failed to list installed patches: %v", err)
	}

	t.Logf("Found %d installed patches", len(patches))
	for i, patch := range patches {
		t.Logf("Patch %d:", i+1)
		t.Logf("  Title: %s", patch.Title)
		t.Logf("  KB: %s", patch.KB)
		t.Logf("  Status: %s", patch.Status)
		t.Logf("  IsInstalled: %v", patch.IsInstalled)
		t.Logf("  RebootRequired: %v", patch.RebootRequired)
		if !patch.InstalledOn.IsZero() {
			t.Logf("  InstalledOn: %s", patch.InstalledOn.Format(time.RFC3339))
		}
	}

	// Check if any patches have "Pending Restart" status
	pendingRestart := false
	for _, patch := range patches {
		if patch.Status == "Pending Restart" {
			pendingRestart = true
			t.Logf("Found patch with Pending Restart status: %s", patch.Title)
		}
	}

	if pendingRestart {
		t.Log("System has patches requiring restart")
	} else {
		t.Log("No patches requiring restart")
	}
}

// TestInstallPatchAndMonitor tests installing a patch and monitoring its progress
func TestInstallPatchAndMonitor(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	updater := NewUpdater()

	// First, get available patches
	patches, err := updater.ListPatches()
	if err != nil {
		t.Fatalf("Failed to list patches: %v", err)
	}

	if len(patches) == 0 {
		t.Skip("No available patches to install")
	}

	// Select the first available patch for testing
	testPatch := patches[0]
	t.Logf("Testing installation of patch: %s (KB%s)", testPatch.Title, testPatch.KB)

	// Start monitoring in a goroutine
	progressChan, err := updater.MonitorInstallProgress(testPatch.KB, 2)
	if err != nil {
		t.Fatalf("Failed to start monitoring: %v", err)
	}

	// Start installation
	go func() {
		progress, err := updater.InstallPatch(testPatch.KB)
		if err != nil {
			t.Logf("Installation error: %v", err)
		} else {
			t.Logf("Installation completed with status: %s", progress.Status)
		}
	}()

	// Monitor progress
	timeout := time.After(5 * time.Minute)
	for {
		select {
		case progress, ok := <-progressChan:
			if !ok {
				t.Log("Progress monitoring completed")
				return
			}
			t.Logf("Progress: KB%s - Status: %s, Percent: %d%%, Complete: %v, RebootRequired: %v",
				progress.KB, progress.Status, progress.PercentComplete, progress.IsComplete, progress.RebootRequired)

			if progress.Error != "" {
				t.Logf("  Error: %s", progress.Error)
			}

			if progress.IsComplete {
				elapsed := progress.EndTime.Sub(progress.StartTime)
				t.Logf("Installation completed in %v", elapsed)
				return
			}

		case <-timeout:
			t.Fatal("Test timeout: installation took too long")
		}
	}
}

// TestInstallPatchInvalidKB tests error handling for invalid KB numbers
func TestInstallPatchInvalidKB(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	updater := NewUpdater()

	// Test with empty KB
	_, err := updater.InstallPatch("")
	if err == nil {
		t.Error("Expected error for empty KB number, got nil")
	}

	// Test with invalid KB that doesn't exist
	progress, err := updater.InstallPatch("KB9999999")
	if err != nil {
		// Error is acceptable
		t.Logf("Installation failed as expected: %v", err)
	} else if progress.Status == "NotFound" || progress.Status == "Failed" {
		// NotFound or Failed status is also acceptable
		t.Logf("Installation returned expected status: %s", progress.Status)
	} else {
		t.Errorf("Expected error or NotFound/Failed status for invalid KB, got: %s", progress.Status)
	}
}

// TestMonitorInstallProgressInvalidKB tests error handling for monitoring with invalid KB
func TestMonitorInstallProgressInvalidKB(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	updater := NewUpdater()

	// Test with empty KB
	_, err := updater.MonitorInstallProgress("", 2)
	if err == nil {
		t.Error("Expected error for empty KB number, got nil")
	}
}

// TestNewUpdater tests creating a new Updater instance
func TestNewUpdater(t *testing.T) {
	updater := NewUpdater()
	if updater == nil {
		t.Error("NewUpdater returned nil")
	}
}

// Example demonstrates how to use the Windows Update patcher
func ExampleUpdater_ListPatches() {
	updater := NewUpdater()
	patches, err := updater.ListPatches()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Available patches: %d\n", len(patches))
	for _, patch := range patches {
		fmt.Printf("- %s (KB%s)\n", patch.Title, patch.KB)
	}
}

// Example demonstrates how to install a patch and monitor progress
func ExampleUpdater_InstallPatch() {
	updater := NewUpdater()

	// Install a patch
	progress, err := updater.InstallPatch("KB1234567")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Installation status: %s\n", progress.Status)
	fmt.Printf("Reboot required: %v\n", progress.RebootRequired)
}

// Example demonstrates how to monitor installation progress
func ExampleUpdater_MonitorInstallProgress() {
	updater := NewUpdater()

	// Start monitoring
	progressChan, err := updater.MonitorInstallProgress("KB1234567", 5)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Read progress updates
	for progress := range progressChan {
		fmt.Printf("Status: %s, Progress: %d%%\n", progress.Status, progress.PercentComplete)
		if progress.IsComplete {
			break
		}
	}
}
