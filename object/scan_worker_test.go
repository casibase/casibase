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

package object

import (
	"testing"
)

func TestMarkTaskActive(t *testing.T) {
	// Test marking a task as active
	scanId := "admin/test-scan"
	
	// Initially should be inactive
	if isTaskActive(scanId) {
		t.Errorf("Expected task %s to be inactive initially", scanId)
	}
	
	// Mark as active
	markTaskActive(scanId, true)
	if !isTaskActive(scanId) {
		t.Errorf("Expected task %s to be active after marking", scanId)
	}
	
	// Mark as inactive
	markTaskActive(scanId, false)
	if isTaskActive(scanId) {
		t.Errorf("Expected task %s to be inactive after unmarking", scanId)
	}
}

func TestGetCurrentHostname(t *testing.T) {
	// The hostname should be empty initially (before InitScanWorker)
	// or set to a value after initialization
	hostname := GetCurrentHostname()
	
	// We can't make strong assertions about hostname value
	// without actually initializing the worker, but we can test
	// that the function doesn't panic
	t.Logf("Current hostname: %s", hostname)
}

func TestIsTaskActiveConcurrency(t *testing.T) {
	// Test concurrent access to active tasks map
	scanId1 := "admin/scan1"
	scanId2 := "admin/scan2"
	
	done := make(chan bool)
	
	// Start multiple goroutines to mark tasks
	for i := 0; i < 10; i++ {
		go func(id string) {
			markTaskActive(id, true)
			if !isTaskActive(id) {
				t.Errorf("Expected task %s to be active", id)
			}
			markTaskActive(id, false)
			done <- true
		}(scanId1)
		
		go func(id string) {
			markTaskActive(id, true)
			if !isTaskActive(id) {
				t.Errorf("Expected task %s to be active", id)
			}
			markTaskActive(id, false)
			done <- true
		}(scanId2)
	}
	
	// Wait for all goroutines to complete
	for i := 0; i < 20; i++ {
		<-done
	}
	
	// Both tasks should be inactive now
	if isTaskActive(scanId1) {
		t.Errorf("Expected task %s to be inactive", scanId1)
	}
	if isTaskActive(scanId2) {
		t.Errorf("Expected task %s to be inactive", scanId2)
	}
}
