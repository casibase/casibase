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
	"errors"
	"fmt"
	"strings"

	"github.com/casibase/pdf"
	"github.com/pdfcpu/pdfcpu/pkg/api"
)

func getPageTexts(p pdf.Page) (texts []pdf.Text, err error) {
	defer func() {
		if r := recover(); r != nil {
			switch x := r.(type) {
			case string:
				err = errors.New(x)
			case error:
				err = x
			default:
				err = errors.New(fmt.Sprint(x))
			}
		}
	}()

	texts = p.Content().Text
	return
}

// getTextFromPdf extracts text from a PDF file using the best available method.
//
// This function uses a two-tier approach for better PDF parsing:
//  1. First, it tries markitdown (if installed), which uses pdfminer-six for robust
//     text extraction from various types of PDFs, including non-standardized ones.
//  2. If markitdown is not available or fails, it falls back to the legacy PDF parser.
//
// The markitdown approach is preferred because it:
// - Handles a wider variety of PDF formats and structures
// - Better extracts text from complex, non-standardized PDFs
// - Properly handles text encoding and layout
//
// To use the improved parsing, install markitdown with PDF support:
//
//	pip install 'markitdown[pdf]'
//
// If markitdown is not installed, the system will automatically use the legacy parser.
func getTextFromPdf(path string) (string, error) {
	// Try markitdown first if available - it's more robust for various PDF types
	text, err := GetTextFromMarkitdown(path, "en")
	if err == nil && len(strings.TrimSpace(text)) > 0 {
		return text, nil
	}

	// Fallback to the original PDF parsing method
	return getTextFromPdfLegacy(path)
}

// getTextFromPdfLegacy is the original PDF text extraction method.
//
// This method uses github.com/casibase/pdf library to extract text from PDFs.
// It works by:
// 1. Validating and optimizing the PDF file if needed
// 2. Opening the PDF and iterating through all pages
// 3. Extracting text elements and merging them based on their Y-coordinates
//
// Note: This method may have limitations with:
// - Non-standardized PDF formats
// - Complex layouts or multi-column text
// - PDFs with unusual encoding
//
// For better results, the primary getTextFromPdf() function should be used,
// which tries markitdown first before falling back to this method.
func getTextFromPdfLegacy(path string) (string, error) {
	err := api.ValidateFile(path, nil)
	if err != nil {
		err = api.OptimizeFile(path, path, nil)
		if err != nil {
			return "", err
		}
	}

	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	totalPage := r.NumPage()
	var mergedTexts []string
	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() || p.V.Key("Contents").Kind() == pdf.Null {
			continue
		}
		var lastTextStyle pdf.Text
		var mergedSentence string

		var texts []pdf.Text
		texts, err = getPageTexts(p)
		if err != nil {
			return "", err
		}
		defer f.Close()

		for _, text := range texts {
			if text.Y == lastTextStyle.Y {
				mergedSentence += text.S
			} else {
				if mergedSentence != "" {
					mergedTexts = append(mergedTexts, mergedSentence)
				}
				lastTextStyle = text
				mergedSentence = text.S
			}
		}

		if mergedSentence != "" {
			mergedTexts = append(mergedTexts, mergedSentence)
		}
	}

	mergedText := strings.Join(mergedTexts, "\n")
	return mergedText, nil
}
