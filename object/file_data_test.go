// Copyright 2023 The Casibase Authors. All Rights Reserved.
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
	"testing"

	"github.com/casibase/casibase/util"
)

func TestFileDataCRUD(t *testing.T) {
	InitConfig()

	// Test data
	testFileData := &FileData{
		Owner:       "admin",
		Store:       "test-store",
		Key:         "test-folder/test-file.txt",
		Title:       "test-file.txt",
		Size:        1024,
		CreatedTime: util.GetCurrentTime(),
		IsLeaf:      true,
		Url:         "http://localhost/test-file.txt",
		Status:      "Active",
		ParentKey:   "test-folder",
	}

	// Test AddFileData
	success, err := AddFileData(testFileData)
	if err != nil {
		t.Errorf("Failed to add file data: %v", err)
	}
	if !success {
		t.Error("AddFileData returned false")
	}

	// Test GetFileData
	retrieved, err := GetFileData("admin", "test-store", "test-folder/test-file.txt")
	if err != nil {
		t.Errorf("Failed to get file data: %v", err)
	}
	if retrieved == nil {
		t.Error("GetFileData returned nil")
	}
	if retrieved != nil && retrieved.Title != "test-file.txt" {
		t.Errorf("Expected title 'test-file.txt', got '%s'", retrieved.Title)
	}

	// Test UpdateFileData
	testFileData.Status = "Archived"
	success, err = UpdateFileData("admin", "test-store", "test-folder/test-file.txt", testFileData)
	if err != nil {
		t.Errorf("Failed to update file data: %v", err)
	}
	if !success {
		t.Error("UpdateFileData returned false")
	}

	// Verify update
	updated, err := GetFileData("admin", "test-store", "test-folder/test-file.txt")
	if err != nil {
		t.Errorf("Failed to get updated file data: %v", err)
	}
	if updated != nil && updated.Status != "Archived" {
		t.Errorf("Expected status 'Archived', got '%s'", updated.Status)
	}

	// Test CountFileDataByStore
	count, err := CountFileDataByStore("admin", "test-store")
	if err != nil {
		t.Errorf("Failed to count file data: %v", err)
	}
	if count < 1 {
		t.Errorf("Expected count >= 1, got %d", count)
	}

	// Test DeleteFileData
	success, err = DeleteFileData("admin", "test-store", "test-folder/test-file.txt")
	if err != nil {
		t.Errorf("Failed to delete file data: %v", err)
	}
	if !success {
		t.Error("DeleteFileData returned false")
	}

	// Verify deletion
	deleted, err := GetFileData("admin", "test-store", "test-folder/test-file.txt")
	if err != nil {
		t.Errorf("Failed to verify deletion: %v", err)
	}
	if deleted != nil {
		t.Error("File data was not deleted")
	}
}
