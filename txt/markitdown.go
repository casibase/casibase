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

package txt

import (
	"bytes"
	"fmt"
	"io"
	"os/exec"
	"runtime"
	"strings"
	"unicode/utf8"

	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

var markitdownExists bool

func init() {
	if _, err := exec.LookPath("markitdown"); err == nil {
		markitdownExists = true
	} else {
		markitdownExists = false
	}
}

func gbkToUtf8(gbkData []byte) (string, error) {
	reader := transform.NewReader(bytes.NewReader(gbkData), simplifiedchinese.GBK.NewDecoder())
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func GetTextFromMarkitdown(path string) (string, error) {
	if !markitdownExists {
		return "", fmt.Errorf("GetTextFromMarkitdown() error, markitdown does not exist")
	}

	var cmd *exec.Cmd
	isWindows := strings.Contains(strings.ToLower(runtime.GOOS), "windows")
	if isWindows {
		cmd = exec.Command("cmd", "/C", fmt.Sprintf("markitdown < %s", path))
	} else {
		cmd = exec.Command("sh", "-c", fmt.Sprintf("markitdown < %s", path))
	}

	err := cmd.Run()
	if err != nil {
		return "", err
	}

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	outputBytes := out.Bytes()
	if utf8.Valid(outputBytes) {
		return string(outputBytes), nil
	}

	utf8Output, err := gbkToUtf8(outputBytes)
	if err != nil {
		return "", err
	}

	return utf8Output, nil
}
