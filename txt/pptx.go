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
	"archive/zip"
	"encoding/xml"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
)

func getPageNumberFromSlideFilename(filename string) int {
	slideRegex := regexp.MustCompile(`ppt/slides/slide(\d+)\.xml`)
	matches := slideRegex.FindStringSubmatch(filename)

	if len(matches) < 2 {
		return -1
	}

	pageNum, err := strconv.Atoi(matches[1])
	if err != nil {
		return -1
	}

	return pageNum
}

func getTextFromPptx(path string) (string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return "", err
	}
	defer r.Close()

	var text strings.Builder

	for _, f := range r.File {
		if strings.HasPrefix(f.Name, "ppt/slides/slide") && strings.HasSuffix(f.Name, ".xml") {
			pageNum := getPageNumberFromSlideFilename(f.Name)

			var slideText strings.Builder

			rc, err := f.Open()
			if err != nil {
				return "", err
			}

			decoder := xml.NewDecoder(rc)
			for {
				token, err := decoder.Token()
				if err == io.EOF {
					break
				}
				if err != nil {
					rc.Close()
					return "", err
				}

				if startElement, ok := token.(xml.StartElement); ok && startElement.Name.Local == "t" {
					var content string
					if err := decoder.DecodeElement(&content, &startElement); err != nil {
						rc.Close()
						return "", err
					}
					slideText.WriteString(content)
					slideText.WriteString(" ")
				}
			}
			rc.Close()

			if slideText.Len() > 0 {
				if pageNum != -1 {
					text.WriteString(fmt.Sprintf("Page %d content is: [%s]", pageNum, slideText.String()))
				} else {
					text.WriteString(fmt.Sprintf("Unknown page content is: [%s]", slideText.String()))
				}
			}

		}
	}

	return text.String(), nil
}
