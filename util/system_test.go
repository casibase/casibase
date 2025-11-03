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

package util

import (
	"testing"
)

func TestGetSystemInfo(t *testing.T) {
	systemInfo, err := GetSystemInfo()
	if err != nil {
		t.Errorf("GetSystemInfo failed: %v", err)
		return
	}

	// Check that CPU usage is retrieved
	if len(systemInfo.CpuUsage) == 0 {
		t.Error("CPU usage should not be empty")
	}

	// Check that memory usage is retrieved
	if systemInfo.MemoryTotal == 0 {
		t.Error("Memory total should not be zero")
	}

	// Check that disk usage is retrieved
	if systemInfo.DiskTotal == 0 {
		t.Error("Disk total should not be zero")
	}

	// Check that network usage fields exist (they might be zero if no network activity yet)
	// NetworkTotal could be zero if no network I/O has occurred
	// Just check that the fields exist and are not negative
	if systemInfo.NetworkSent < 0 {
		t.Error("Network sent should not be negative")
	}
	if systemInfo.NetworkRecv < 0 {
		t.Error("Network received should not be negative")
	}
	if systemInfo.NetworkTotal < 0 {
		t.Error("Network total should not be negative")
	}

	// Verify that NetworkTotal is the sum of NetworkSent and NetworkRecv
	expectedTotal := systemInfo.NetworkSent + systemInfo.NetworkRecv
	if systemInfo.NetworkTotal != expectedTotal {
		t.Errorf("Network total mismatch: expected %d, got %d", expectedTotal, systemInfo.NetworkTotal)
	}
}

func TestGetNetworkUsage(t *testing.T) {
	sent, recv, total, err := getNetworkUsage()
	if err != nil {
		t.Errorf("getNetworkUsage failed: %v", err)
		return
	}

	// Network values should be non-negative
	if sent < 0 {
		t.Error("Network sent should not be negative")
	}
	if recv < 0 {
		t.Error("Network received should not be negative")
	}
	if total < 0 {
		t.Error("Network total should not be negative")
	}

	// Total should equal sent + recv
	expectedTotal := sent + recv
	if total != expectedTotal {
		t.Errorf("Network total mismatch: expected %d (sent=%d + recv=%d), got %d", expectedTotal, sent, recv, total)
	}
}
