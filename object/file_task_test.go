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

func TestFileTaskCRUD(t *testing.T) {
	InitConfig()

	// Create a test file task
	fileTask := &FileTask{
		Owner:       "admin",
		Name:        util.GetRandomName(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		Store:       "test-store",
		FileKey:     "test/file.pdf",
		FileName:    "file.pdf",
		Status:      FileTaskStatusPending,
	}

	// Test Add
	added, err := AddFileTask(fileTask)
	if err != nil {
		t.Fatalf("Failed to add file task: %v", err)
	}
	if !added {
		t.Fatal("File task was not added")
	}

	// Test Get
	retrievedTask, err := GetFileTask(fileTask.GetId())
	if err != nil {
		t.Fatalf("Failed to get file task: %v", err)
	}
	if retrievedTask == nil {
		t.Fatal("File task not found")
	}
	if retrievedTask.Status != FileTaskStatusPending {
		t.Errorf("Expected status %s, got %s", FileTaskStatusPending, retrievedTask.Status)
	}

	// Test Update
	retrievedTask.Status = FileTaskStatusInProgress
	updated, err := UpdateFileTask(retrievedTask.GetId(), retrievedTask)
	if err != nil {
		t.Fatalf("Failed to update file task: %v", err)
	}
	if !updated {
		t.Fatal("File task was not updated")
	}

	// Verify update
	updatedTask, err := GetFileTask(retrievedTask.GetId())
	if err != nil {
		t.Fatalf("Failed to get updated file task: %v", err)
	}
	if updatedTask.Status != FileTaskStatusInProgress {
		t.Errorf("Expected status %s, got %s", FileTaskStatusInProgress, updatedTask.Status)
	}

	// Test GetPendingFileTasks
	pendingTask := &FileTask{
		Owner:       "admin",
		Name:        util.GetRandomName(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		Store:       "test-store",
		FileKey:     "test/pending.pdf",
		FileName:    "pending.pdf",
		Status:      FileTaskStatusPending,
	}
	_, err = AddFileTask(pendingTask)
	if err != nil {
		t.Fatalf("Failed to add pending file task: %v", err)
	}

	pendingTasks, err := GetPendingFileTasks(10)
	if err != nil {
		t.Fatalf("Failed to get pending file tasks: %v", err)
	}
	if len(pendingTasks) == 0 {
		t.Error("Expected at least one pending file task")
	}

	// Test Delete
	deleted, err := DeleteFileTask(retrievedTask)
	if err != nil {
		t.Fatalf("Failed to delete file task: %v", err)
	}
	if !deleted {
		t.Fatal("File task was not deleted")
	}

	// Clean up
	_, _ = DeleteFileTask(pendingTask)

	// Verify delete
	deletedTask, err := GetFileTask(retrievedTask.GetId())
	if err != nil {
		t.Fatalf("Error checking deleted file task: %v", err)
	}
	if deletedTask != nil {
		t.Error("File task should have been deleted")
	}
}

func TestGetFileTaskByFileKey(t *testing.T) {
	InitConfig()

	// Create a test file task
	fileTask := &FileTask{
		Owner:       "admin",
		Name:        util.GetRandomName(),
		CreatedTime: util.GetCurrentTime(),
		UpdatedTime: util.GetCurrentTime(),
		Store:       "test-store",
		FileKey:     "unique/test/file.pdf",
		FileName:    "file.pdf",
		Status:      FileTaskStatusPending,
	}

	// Add the file task
	_, err := AddFileTask(fileTask)
	if err != nil {
		t.Fatalf("Failed to add file task: %v", err)
	}

	// Test GetFileTaskByFileKey
	retrievedTask, err := GetFileTaskByFileKey(fileTask.Store, fileTask.FileKey)
	if err != nil {
		t.Fatalf("Failed to get file task by file key: %v", err)
	}
	if retrievedTask == nil {
		t.Fatal("File task not found by file key")
	}
	if retrievedTask.FileKey != fileTask.FileKey {
		t.Errorf("Expected file key %s, got %s", fileTask.FileKey, retrievedTask.FileKey)
	}

	// Clean up
	_, _ = DeleteFileTask(fileTask)
}
