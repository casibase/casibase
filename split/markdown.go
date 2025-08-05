// Copyright 2025 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package split

import (
	"fmt"
	"regexp"
	"strings"
)

type MarkdownSplitProvider struct{}

func NewMarkdownSplitProvider() (*MarkdownSplitProvider, error) {
	return &MarkdownSplitProvider{}, nil
}

func ExtractMarkdownTree(markdownText string) map[string]string {
	numberedHeadingPattern := regexp.MustCompile(`^(\d+(\.\d+)*\.)\s+(.+)$`)
	hashHeadingPattern := regexp.MustCompile(`^(#{1,6})\s+(.+)$`)

	lines := strings.Split(markdownText, "\n")
	result := make(map[string]string)

	var currentKey string
	var currentContent []string
	var path []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		var isHeading bool
		var level int
		var title string

		if m := hashHeadingPattern.FindStringSubmatch(line); m != nil {
			title = fmt.Sprintf("%s %s", m[1], m[2])
			level = len(m[1])
			isHeading = true
		} else if m := numberedHeadingPattern.FindStringSubmatch(line); m != nil {
			title = fmt.Sprintf("%s %s", m[1], m[3])
			level = strings.Count(m[1], ".")
			isHeading = true
		}

		if isHeading {
			if currentKey != "" {
				result[currentKey] = strings.TrimSpace(strings.Join(currentContent, "\n"))
			} else {
				result["root"] = strings.TrimSpace(strings.Join(currentContent, "\n"))
			}

			// update path by level
			if level == len(path)+1 {
				// normal level up
				path = append(path, title)
			} else if level == len(path) {
				// same level, replace the last layer
				path[len(path)-1] = title
			} else if level < len(path) {
				// return to parent level
				path = path[:level-1]
				path = append(path, title)
			} else {
				path = append(path, title)
			}

			currentKey = strings.Join(path, " > ")
			currentContent = []string{}
		} else {
			currentContent = append(currentContent, line)
		}
	}

	if currentKey != "" {
		result[currentKey] = strings.TrimSpace(strings.Join(currentContent, "\n"))
	} else {
		result["root"] = strings.TrimSpace(strings.Join(currentContent, "\n"))
	}

	return result
}

func ExtractTablesAndRemainder(markdownText string) (string, []string, error) {
	tables := []string{}
	remainder := markdownText

	if strings.Contains(markdownText, "|") {
		// Standard Markdown table matching pattern
		borderTablePattern := regexp.MustCompile(`(?m)(?:\n|^)(?:\|.*?\|.*?\|.*?\n)(?:\|(?:\s*[:-]+[-| :]*\s*)\|.*?\n)(?:\|.*?\|.*?\|.*?\n)+`)
		borderTables := borderTablePattern.FindAllString(markdownText, -1)
		tables = append(tables, borderTables...)
		remainder = borderTablePattern.ReplaceAllString(remainder, "\n")

		// Borderless Markdown Table Matching Mode
		noBorderTablePattern := regexp.MustCompile(`(?m)(?:\n|^)(?:\S.*?\|.*?\n)(?:(?:\s*[:-]+[-| :]*\s*).*?\n)(?:\S.*?\|.*?\n)+`)
		noBorderTables := noBorderTablePattern.FindAllString(remainder, -1)
		tables = append(tables, noBorderTables...)
		remainder = noBorderTablePattern.ReplaceAllString(remainder, "\n")
	}

	// If the remaining text contains'<table>'(case ignored), try extracting the HTML table
	if strings.Contains(strings.ToLower(remainder), "<table>") {
		htmlTablePattern := regexp.MustCompile(`(?i)(?:\n|^)\s*(?:(?:<html[^>]*>\s*<body[^>]*>\s*<table[^>]*>[\s\S]*?</table>\s*</body>\s*</html>)|(?:<body[^>]*>\s*<table[^>]*>[\s\S]*?</table>\s*</body>)|(?:<table[^>]*>[\s\S]*?</table>))\s*(?:\n|$)`)
		htmlTables := htmlTablePattern.FindAllString(remainder, -1)
		tables = append(tables, htmlTables...)
		remainder = htmlTablePattern.ReplaceAllString(remainder, "\n")
	}
	return remainder, tables, nil
}

func ExtractTablesWithContext(markdownText string, contextKey string) (string, []string, error) {
	remainder, tables, err := ExtractTablesAndRemainder(markdownText)
	if err != nil {
		return "", nil, err
	}

	tablesWithContext := make([]string, len(tables))
	for i, table := range tables {
		tablesWithContext[i] = contextKey + "\n\n" + table
	}

	return remainder, tablesWithContext, nil
}

func (p *MarkdownSplitProvider) SplitText(text string) ([]string, error) {
	headingsMap := ExtractMarkdownTree(text)

	var sections []string

	for key, content := range headingsMap {
		remainder, tables, err := ExtractTablesWithContext(content, key)
		if err != nil {
			return nil, err
		}

		// add tables to sections
		for _, table := range tables {
			sections = append(sections, strings.TrimSpace(table))
		}

		// add text to sections
		if strings.TrimSpace(remainder) != "" {
			textSplitter, err := NewDefaultSplitProvider("markdown")
			if err != nil {
				return nil, err
			}

			textSections, err := textSplitter.SplitText(remainder)
			if err != nil {
				return nil, err
			}

			for _, section := range textSections {
				if strings.TrimSpace(section) != "" {
					sections = append(sections, key+"\n\n"+strings.TrimSpace(section))
				}
			}
		}
	}

	return sections, nil
}
