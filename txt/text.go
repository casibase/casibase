// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"fmt"
	"os"
	"strings"

	"github.com/casibase/casibase/util"
)

func GetTextSections(text string) []string {
	const maxLength = 210 * 3
	var res []string
	var temp string

	for _, line := range strings.Split(text, "\n") {
		if len(temp)+len(line) <= maxLength {
			temp += line
		} else {
			res = append(res, temp)
			temp = line
		}
	}

	if len(temp) > 0 {
		res = append(res, temp)
	}

	return res
}

func GetSupportedFileTypes() []string {
	return []string{".txt", ".md", ".csv", ".yaml", ".docx", ".pdf"}
}

func GetParsedTextFromUrl(url string, ext string) (string, error) {
	if strings.Contains(url, ":/") {
		res := util.ReadStringFromPath(url)
		return res, nil
	}

	path, err := getTempFilePathFromUrl(url)
	if err != nil {
		return "", err
	}
	defer func() {
		err = os.Remove(path)
		if err != nil {
			fmt.Printf("%v\n", err.Error())
		}
	}()

	var res string
	if ext == ".txt" || ext == ".md" || ext == ".csv" || ext == ".yaml" {
		res, err = getTextFromPlain(path)
	} else if ext == ".docx" {
		res, err = getTextFromDocx(path)
	} else if ext == ".pdf" {
		res, err = getTextFromPdf(path)
	} else {
		return "", fmt.Errorf("unsupported file type: %s", ext)
	}
	if err != nil {
		return "", err
	}

	return res, nil
}
