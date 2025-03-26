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
	"bytes"
	"fmt"
	"log"
	"os/exec"
	"runtime"
	"strings"
	"sync"

	"github.com/carmel/gooxml/document"
)

var (
	markitdownExists bool
	isWindows        bool
	once             sync.Once
)

func init() {
	once.Do(func() {
		// Check if the markitdown tool exists
		if _, err := exec.LookPath("markitdown"); err == nil {
			markitdownExists = true
		} else {
			markitdownExists = false
		}

		// Check if the OS is Windows
		isWindows = strings.Contains(strings.ToLower(runtime.GOOS), "windows")
	})
}

func GetTextFromDocx(path string) (string, error) {
	if markitdownExists {
		var cmd *exec.Cmd
		if isWindows {
			cmd = exec.Command("cmd", "/C", fmt.Sprintf("markitdown < %s", path))
			log.Printf("Processing file: %s with markitdown in windows", path)
		} else {
			cmd = exec.Command("sh", "-c", fmt.Sprintf("markitdown < %s", path))
			log.Printf("Processing file: %s with markitdown in linux", path)
		}
		var out, stderr bytes.Buffer
		cmd.Stdout = &out
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			log.Printf("Error running markitdown command: %v, stderr: %s", err, stderr.String())
			return "", err
		}
		return out.String(), nil
	}

	log.Printf("Processing file: %s with gooxml", path)
	docx, err := document.Open(path)
	if err != nil {
		log.Printf("Error opening .docx file: %v", err)
		return "", err
	}

	paragraphs := []string{}
	for _, para := range docx.Paragraphs() {
		var paraText string

		for _, run := range para.Runs() {
			paraText += run.Text()
		}

		if len(para.Runs()) > 1 {
			paragraphs = append(paragraphs, paraText+"\n\n")
		} else {
			paragraphs = append(paragraphs, paraText+"\n")
		}
	}

	if len(paragraphs) == 0 {
		err := fmt.Errorf(".docx file is empty")
		log.Printf("Error: %v", err)
		return "", err
	}

	text := strings.Join(paragraphs, "")
	return text, nil
}
