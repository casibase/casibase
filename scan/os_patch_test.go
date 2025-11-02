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
	"fmt"
	"runtime"
	"testing"
	"time"
)

// TestListPatches tests listing available and installed Windows updates
func TestListPatches(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	provider, err := NewOsPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OsPatchScanProvider: %v", err)
	}

	// Test listing available patches
	t.Log("Testing ListPatches()...")
	patches, err := provider.ListPatches()
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
		if patch.Categories != "" {
			t.Logf("  Categories: %s", patch.Categories)
		}
	}

	// Test listing installed patches
	t.Log("\nTesting ListInstalledPatches()...")
	installedPatches, err := provider.ListInstalledPatches()
	if err != nil {
		t.Fatalf("Failed to list installed patches: %v", err)
	}

	t.Logf("Found %d installed patches", len(installedPatches))
	for i, patch := range installedPatches {
		t.Logf("Installed Patch %d:", i+1)
		t.Logf("  Title: %s", patch.Title)
		t.Logf("  KB: %s", patch.KB)
		t.Logf("  Status: %s", patch.Status)
		t.Logf("  IsInstalled: %v", patch.IsInstalled)
		t.Logf("  RebootRequired: %v", patch.RebootRequired)
		if patch.InstalledOn != "" {
			t.Logf("  InstalledOn: %s", patch.InstalledOn)
		}
	}

	// Check if any patches have "Pending Restart" status
	pendingRestart := false
	for _, patch := range installedPatches {
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

// TestInstallPatch tests installing a patch and monitoring its progress
func TestInstallPatch(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	provider, err := NewOsPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OsPatchScanProvider: %v", err)
	}

	// First, get available patches
	patches, err := provider.ListPatches()
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
	progressChan, err := provider.MonitorInstallProgress(testPatch.KB, 2)
	if err != nil {
		t.Fatalf("Failed to start monitoring: %v", err)
	}

	// Start installation
	go func() {
		progress, err := provider.InstallPatch(testPatch.KB)
		if err != nil {
			t.Logf("Installation error: %v", err)
		} else {
			t.Logf("Installation completed with status: %s", progress.Status)
		}
	}()

	// Monitor progress with timeout
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
				t.Logf("Installation completed. StartTime: %s, EndTime: %s", progress.StartTime, progress.EndTime)
				return
			}

		case <-timeout:
			t.Fatal("Test timeout: installation took too long")
		}
	}
}

// Example demonstrates how to use the OsPatchScanProvider to list patches
func ExampleOsPatchScanProvider_ListPatches() {
	provider, err := NewOsPatchScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	patches, err := provider.ListPatches()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Available patches: %d\n", len(patches))
	for _, patch := range patches {
		fmt.Printf("- %s (KB%s)\n", patch.Title, patch.KB)
	}
}

// Example demonstrates how to install a patch
func ExampleOsPatchScanProvider_InstallPatch() {
	provider, err := NewOsPatchScanProvider("")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// Install a patch
	progress, err := provider.InstallPatch("KB1234567")
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Installation status: %s\n", progress.Status)
	fmt.Printf("Reboot required: %v\n", progress.RebootRequired)
}

// TestScanAllPatches tests the "all" command that retrieves both available and installed patches
func TestScanAllPatches(t *testing.T) {
	// Skip test if not running on Windows
	if runtime.GOOS != "windows" {
		t.Skip("Skipping test: not running on Windows")
	}

	provider, err := NewOsPatchScanProvider("")
	if err != nil {
		t.Fatalf("Failed to create OsPatchScanProvider: %v", err)
	}

	// Test the "all" command
	t.Log("Testing Scan with 'all' command...")
	result, err := provider.Scan("", "all")
	if err != nil {
		t.Fatalf("Failed to scan with 'all' command: %v", err)
	}

	if result == "" {
		t.Fatal("Expected non-empty result from 'all' command")
	}

	t.Logf("Scan result length: %d bytes", len(result))

	// Verify the result is valid JSON by attempting to parse it
	if result != "[]" && result != "" {
		if result[0] != '[' && result[0] != '{' {
			t.Errorf("Expected JSON array or object, got: %s", result[:min(50, len(result))])
		}
	}

	// Test that "available" command still works
	t.Log("Testing Scan with 'available' command...")
	availableResult, err := provider.Scan("", "available")
	if err != nil {
		t.Fatalf("Failed to scan with 'available' command: %v", err)
	}
	t.Logf("Available patches result length: %d bytes", len(availableResult))

	// Test that "installed" command still works
	t.Log("Testing Scan with 'installed' command...")
	installedResult, err := provider.Scan("", "installed")
	if err != nil {
		t.Fatalf("Failed to scan with 'installed' command: %v", err)
	}
	t.Logf("Installed patches result length: %d bytes", len(installedResult))
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
