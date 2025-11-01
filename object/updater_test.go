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

package object

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

	updater := NewUpdater()

	// Test listing available patches
	t.Log("Testing ListPatches()...")
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
		if patch.Categories != "" {
			t.Logf("  Categories: %s", patch.Categories)
		}
	}

	// Test listing installed patches
	t.Log("\nTesting ListInstalledPatches()...")
	installedPatches, err := updater.ListInstalledPatches()
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

// Example demonstrates how to install a patch
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
