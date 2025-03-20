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

package txt

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

func TestProcessFiles(t *testing.T) {
	inputDir := "inputdir"   // 指定输入文件目录
	outputDir := "outputdir" // 指定输出目录

	if _, err := os.Stat(outputDir); os.IsNotExist(err) {
		err := os.Mkdir(outputDir, 0o755)
		if err != nil {
			t.Fatalf("创建输出目录失败: %v\n", err)
		}
	}

	supportedExts := []string{".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"}

	files, err := ioutil.ReadDir(inputDir)
	if err != nil {
		t.Fatalf("读取输入目录失败: %v\n", err)
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	totalFiles := len(files)
	processedFiles := 0

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		fileName := file.Name()
		fileExt := strings.ToLower(filepath.Ext(fileName))

		if contains(supportedExts, fileExt) {
			wg.Add(1)
			go func(fileName string, fileExt string) {
				defer wg.Done()

				inputFilePath := filepath.Join(inputDir, fileName)
				outputFileName := strings.TrimSuffix(fileName, fileExt) + ".md"
				outputFilePath := filepath.Join(outputDir, outputFileName)

				parsedText, err := GetParsedTextFromUrl(inputFilePath, fileExt)
				if err != nil {
					mu.Lock()
					t.Logf("处理文件 %s 失败: %v\n", inputFilePath, err)
					mu.Unlock()
					return
				}

				err = ioutil.WriteFile(outputFilePath, []byte(parsedText), 0o644)
				if err != nil {
					mu.Lock()
					t.Logf("写入文件 %s 失败: %v\n", outputFilePath, err)
					mu.Unlock()
					return
				}

				mu.Lock()
				processedFiles++
				t.Logf("成功处理文件: %s (%d/%d)\n", inputFilePath, processedFiles, totalFiles)
				mu.Unlock()
			}(fileName, fileExt)
		}
	}

	wg.Wait()
	t.Log("所有文件处理完毕")
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
