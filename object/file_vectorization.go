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
	"fmt"
	"path/filepath"
	"strings"

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/i18n"
	"github.com/casibase/casibase/split"
	"github.com/casibase/casibase/txt"
	"github.com/cenkalti/backoff/v4"
)

// VectorizeFile vectorizes a single file
func VectorizeFile(fileTask *FileTask, lang string) error {
	store, err := GetStore(fmt.Sprintf("%s/%s", fileTask.Owner, fileTask.Store))
	if err != nil {
		return err
	}
	if store == nil {
		return fmt.Errorf("store not found: %s/%s", fileTask.Owner, fileTask.Store)
	}

	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return err
	}

	modelProvider, err := store.GetModelProvider()
	if err != nil {
		return err
	}
	if modelProvider == nil {
		return fmt.Errorf(i18n.Translate(lang, "object:The model provider for store: %s is not found"), store.GetId())
	}

	embeddingProvider, err := store.GetEmbeddingProvider()
	if err != nil {
		return err
	}
	if embeddingProvider == nil {
		return fmt.Errorf(i18n.Translate(lang, "object:The embedding provider for store: %s is not found"), store.GetId())
	}

	embeddingProviderObj, err := embeddingProvider.GetEmbeddingProvider(lang)
	if err != nil {
		return err
	}

	// Get file object
	objects, err := storageProviderObj.ListObjects(fileTask.FileKey)
	if err != nil {
		return err
	}

	if len(objects) == 0 {
		return fmt.Errorf("file not found: %s", fileTask.FileKey)
	}

	file := objects[0]
	
	// Check if file is a supported text file
	fileExt := filepath.Ext(file.Key)
	fileTypes := txt.GetSupportedFileTypes()
	supported := false
	for _, ft := range fileTypes {
		if ft == fileExt {
			supported = true
			break
		}
	}
	
	if !supported {
		return fmt.Errorf("unsupported file type: %s", fileExt)
	}

	// Parse text from file
	text, err := txt.GetParsedTextFromUrl(file.Url, fileExt, lang)
	if err != nil {
		return err
	}

	// Determine split provider
	splitProviderType := store.SplitProvider
	if splitProviderType == "" {
		splitProviderType = "Default"
	}

	if strings.HasPrefix(file.Key, "QA") && fileExt == ".docx" {
		splitProviderType = "QA"
	}

	if fileExt == ".md" {
		splitProviderType = "Markdown"
	}

	splitProvider, err := split.GetSplitProvider(splitProviderType)
	if err != nil {
		return err
	}

	// Split text into sections
	textSections, err := splitProvider.SplitText(text)
	if err != nil {
		return err
	}

	// Generate embeddings for each section
	for i, textSection := range textSections {
		// Check if vector already exists
		vector, err := getVectorByIndex("admin", store.Name, file.Key, i)
		if err != nil {
			return err
		}

		if vector != nil {
			logs.Info("[%d/%d] Skipping existing embedding for store: [%s], file: [%s], index: [%d]", i+1, len(textSections), store.Name, file.Key, i)
			continue
		}

		logs.Info("[%d/%d] Generating embedding for store: [%s], file: [%s], index: [%d]: %s", i+1, len(textSections), store.Name, file.Key, i, textSection)

		operation := func() error {
			_, err := addEmbeddedVector(embeddingProviderObj, textSection, store.Name, file.Key, i, embeddingProvider.Name, modelProvider.SubType, lang)
			if err != nil {
				if isRetryableError(err) {
					return err
				}
				return backoff.Permanent(err)
			}
			return nil
		}

		err = backoff.Retry(operation, backoff.NewExponentialBackOff())
		if err != nil {
			logs.Error("Failed to generate embedding after retries: %v", err)
			return err
		}
	}

	return nil
}

// ProcessFileTask processes a single file task
func ProcessFileTask(fileTask *FileTask, lang string) error {
	// Update status to In Progress
	fileTask.Status = FileTaskStatusInProgress
	fileTask.Error = ""
	_, err := UpdateFileTask(fileTask.GetId(), fileTask)
	if err != nil {
		return err
	}

	// Vectorize the file
	err = VectorizeFile(fileTask, lang)
	if err != nil {
		// Update status to Failed
		fileTask.Status = FileTaskStatusFailed
		fileTask.Error = err.Error()
		_, updateErr := UpdateFileTask(fileTask.GetId(), fileTask)
		if updateErr != nil {
			logs.Error("Failed to update file task status: %v", updateErr)
		}
		return err
	}

	// Update status to Completed
	fileTask.Status = FileTaskStatusCompleted
	_, err = UpdateFileTask(fileTask.GetId(), fileTask)
	if err != nil {
		return err
	}

	return nil
}
