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
	"regexp"
	"strings"
)

type MarkdownSplitProvider struct{}

func NewMarkdownSplitProvider() (*MarkdownSplitProvider, error) {
	return &MarkdownSplitProvider{}, nil
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

func (p *MarkdownSplitProvider) SplitText(text string) ([]string, error) {
	sections := []string{}

	remainder, tables, err := ExtractTablesAndRemainder(text)
	if err != nil {
		return nil, err
	}

	textSplitter, err := NewDefaultSplitProvider("markdown")
	if err != nil {
		return nil, err
	}

	sections, err = textSplitter.SplitText(remainder)
	if err != nil {
		return nil, err
	}

	for _, table := range tables {
		sections = append(sections, strings.TrimSpace(table))
	}

	return sections, nil
}
