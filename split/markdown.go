// Copyright 2024 The Casibase Authors. All Rights Reserved.
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
	"log"
	"regexp"
	"strings"
	"unicode"
)

type MarkdownSplitProvider struct {
	IsSeparatorRegex bool
	KeepSeparator    bool
	ChunkSize        int
	ChunkOverlap     int
	LengthFunction   func(string) int
	StripWhitespace  bool
}

func NewMarkdownSplitProvider() (*MarkdownSplitProvider, error) {
	return &MarkdownSplitProvider{
		IsSeparatorRegex: true,
		KeepSeparator:    true,
		ChunkSize:        16,
		LengthFunction: func(s string) int {
			return len(s)
		},
		StripWhitespace: true,
		ChunkOverlap:    0,
	}, nil
}

func NewMarkdownSplitProviderWithParams(
	isSeparatorRegex bool,
	keepSeparator bool,
	chunkSize int,
	lengthFunction func(string) int,
	stripWhitespace bool,
	chunkOverlap int,
) (*MarkdownSplitProvider, error) {
	if chunkSize <= 0 {
		return nil, fmt.Errorf("chunkSize must be greater than 0")
	}
	if lengthFunction == nil {
		return nil, fmt.Errorf("lengthFunction cannot be nil")
	}
	if chunkOverlap < 0 {
		return nil, fmt.Errorf("chunkOverlap cannot be negative")
	}

	return &MarkdownSplitProvider{
		IsSeparatorRegex: isSeparatorRegex,
		KeepSeparator:    keepSeparator,
		ChunkSize:        chunkSize,
		LengthFunction:   lengthFunction,
		StripWhitespace:  stripWhitespace,
		ChunkOverlap:     chunkOverlap,
	}, nil
}

func (p *MarkdownSplitProvider) JoinDocs(docs []string, separator string) (string, error) {
	text := strings.Join(docs, separator)
	if p.StripWhitespace {
		text = strings.TrimFunc(text, unicode.IsSpace)
	}
	if text == "" {
		return "", nil
	}
	return text, nil
}

func (p *MarkdownSplitProvider) MergeSplits(splits []string, sep string) ([]string, error) {
	separatorLen := p.LengthFunction(sep)
	var docs []string
	var currentDoc []string
	total := 0

	for _, d := range splits {
		l := p.LengthFunction(d)
		if total+l+(separatorLen*len(currentDoc)) > p.ChunkSize {
			if total > p.ChunkSize {
				log.Printf("Created a chunk of size %d, which is longer than the specified %d", total, p.ChunkSize)
			}
			if len(currentDoc) > 0 {
				doc, err := p.JoinDocs(currentDoc, sep)
				if err != nil {
					return docs, nil
				}
				if doc != "" {
					docs = append(docs, doc)
				}
				for total > p.ChunkOverlap || (total+l+(separatorLen*len(currentDoc)) > p.ChunkSize && total > 0) {
					total -= p.LengthFunction(currentDoc[0]) + separatorLen
					currentDoc = currentDoc[1:]
				}
			}
		}
		currentDoc = append(currentDoc, d)
		total += l + separatorLen
	}
	doc, err := p.JoinDocs(currentDoc, sep)
	if err != nil {
		return docs, err
	}
	if doc != "" {
		docs = append(docs, doc)
	}

	return docs, nil
}

func splitTextWithRegex(text, pattern string, keepSeparator bool) ([]string, error) {
	var result []string
	if pattern != "" {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringIndex(text, -1)
		var splits []string
		if keepSeparator {
			lastStart := 0
			for index := range len(matches) {
				splits = append(splits, text[lastStart:matches[index][0]])
				lastStart = matches[index][0]
			}
			splits = append(splits, text[lastStart:])
		} else {
			splits = re.Split(text, -1)
		}

		for _, s := range splits {
			if s != "" {
				result = append(result, s)
			}
		}
		return result, nil
	}

	for _, r := range text {
		result = append(result, string(r))
	}
	return result, nil
}

func (p *MarkdownSplitProvider) SplitTextRecursion(text string, separators []string) ([]string, error) {
	finalChunks := []string{}
	separator := separators[len(separators)-1]
	var newSeparators []string

	for i, s := range separators {
		var sepPattern string
		if p.IsSeparatorRegex {
			sepPattern = s
		} else {
			sepPattern = regexp.QuoteMeta(s)
		}
		if s == "" {
			separator = s
			break
		}
		re := regexp.MustCompile(sepPattern)
		if re.MatchString(text) {
			separator = s
			newSeparators = separators[i+1:]
			break
		}
	}

	var pattern string
	if p.IsSeparatorRegex {
		pattern = separator
	} else {
		pattern = regexp.QuoteMeta(separator)
	}
	splits, err := splitTextWithRegex(text, pattern, p.KeepSeparator)
	if err != nil {
		return nil, err
	}
	var goodSplits []string
	sepToUse := ""
	if !p.KeepSeparator {
		sepToUse = separator
	}
	for _, s := range splits {
		if p.LengthFunction(s) < p.ChunkSize {
			goodSplits = append(goodSplits, s)
		} else {
			if len(goodSplits) > 0 {
				merged, err := p.MergeSplits(goodSplits, sepToUse)
				if err != nil {
					return nil, err
				}
				finalChunks = append(finalChunks, merged...)
				goodSplits = []string{}
			}
			if len(newSeparators) == 0 {
				finalChunks = append(finalChunks, s)
			} else {
				otherInfo, err := p.SplitTextRecursion(s, newSeparators)
				if err != nil {
					return nil, err
				}
				finalChunks = append(finalChunks, otherInfo...)
			}
		}
	}
	if len(goodSplits) > 0 {
		merged, err := p.MergeSplits(goodSplits, sepToUse)
		if err != nil {
			return nil, err
		}
		finalChunks = append(finalChunks, merged...)
	}
	return finalChunks, nil
}

func (p *MarkdownSplitProvider) SplitText(text string) ([]string, error) {
	separators := []string{
		"\n#{1,6} ",
		"```\n",
		"\n\\*\\*\\*+\n",
		"\n---+\n",
		"\n___+\n",
		"\n\n",
		"\n",
		" ",
		"",
	}
	return p.SplitTextRecursion(text, separators)
}
