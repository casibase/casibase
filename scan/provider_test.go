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
	"testing"
)

func TestGetScanProvider_Nmap(t *testing.T) {
	provider, err := GetScanProvider("Nmap", "", "en")
	
	// Nmap might not be installed on the test system, which is acceptable
	if err != nil {
		t.Logf("Nmap not available on this system: %v", err)
		return
	}

	if provider == nil {
		t.Fatal("Expected provider to be non-nil when no error is returned")
	}

	// Verify it's the correct type
	if _, ok := provider.(*NmapScanProvider); !ok {
		t.Error("Expected provider to be of type *NmapScanProvider")
	}
}

func TestGetScanProvider_OSPatch(t *testing.T) {
	provider, err := GetScanProvider("OS Patch", "", "en")
	if err != nil {
		t.Fatalf("Failed to get OS Patch scan provider: %v", err)
	}

	if provider == nil {
		t.Fatal("Expected provider to be non-nil")
	}

	// Verify it's the correct type
	if _, ok := provider.(*OSPatchScanProvider); !ok {
		t.Error("Expected provider to be of type *OSPatchScanProvider")
	}
}

func TestGetScanProvider_Unknown(t *testing.T) {
	provider, err := GetScanProvider("UnknownProvider", "", "en")
	if err != nil {
		t.Fatalf("Expected no error for unknown provider, got: %v", err)
	}

	if provider != nil {
		t.Error("Expected provider to be nil for unknown provider type")
	}
}
