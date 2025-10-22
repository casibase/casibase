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

package object

import (
	"time"

	"github.com/beego/beego/logs"
	"github.com/robfig/cron/v3"
)

var fileTaskWorker *cron.Cron

// InitFileTaskWorker initializes the background worker for processing file tasks
func InitFileTaskWorker() {
	fileTaskWorker = cron.New()
	
	// Run every minute to process pending file tasks
	_, err := fileTaskWorker.AddFunc("@every 1m", func() {
		processFileTasksBatch()
	})
	
	if err != nil {
		logs.Error("Failed to schedule file task worker: %v", err)
		return
	}
	
	fileTaskWorker.Start()
	logs.Info("File task worker started")
}

// processFileTasksBatch processes a batch of pending file tasks
func processFileTasksBatch() {
	// Get pending tasks (limit to 10 per batch to avoid overload)
	tasks, err := GetPendingFileTasks(10)
	if err != nil {
		logs.Error("Failed to get pending file tasks: %v", err)
		return
	}
	
	if len(tasks) == 0 {
		return
	}
	
	logs.Info("Processing %d pending file tasks", len(tasks))
	
	for _, task := range tasks {
		// Process each task with default language
		lang := "en"
		
		logs.Info("Processing file task: %s for file: %s in store: %s", task.Name, task.FileKey, task.Store)
		
		err := ProcessFileTask(task, lang)
		if err != nil {
			logs.Error("Failed to process file task %s: %v", task.Name, err)
		} else {
			logs.Info("Successfully processed file task: %s", task.Name)
		}
		
		// Add a small delay between tasks to avoid overwhelming the system
		time.Sleep(1 * time.Second)
	}
}

// StopFileTaskWorker stops the background worker
func StopFileTaskWorker() {
	if fileTaskWorker != nil {
		fileTaskWorker.Stop()
		logs.Info("File task worker stopped")
	}
}
