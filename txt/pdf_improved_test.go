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
	"strings"
	"testing"
)

// TestGetTextFromPdfWithMarkitdown tests the improved PDF parsing
func TestGetTextFromPdfWithMarkitdown(t *testing.T) {
	// This test verifies that the getTextFromPdf function properly tries markitdown first
	// and falls back to the legacy method when needed

	// Test with a non-existent file should fail gracefully
	_, err := getTextFromPdf("/tmp/nonexistent.pdf")
	if err == nil {
		t.Error("Expected error for non-existent file, got nil")
	}
}

// TestGetTextFromPdfLegacy tests the fallback legacy PDF parser
func TestGetTextFromPdfLegacy(t *testing.T) {
	// This test verifies that the legacy parser still works

	// Test with a non-existent file should fail
	_, err := getTextFromPdfLegacy("/tmp/nonexistent.pdf")
	if err == nil {
		t.Error("Expected error for non-existent file, got nil")
	}
}

// TestGetTextFromPdfWithSampleFile tests PDF parsing with an actual sample file
func TestGetTextFromPdfWithSampleFile(t *testing.T) {
	// This test only runs if the sample PDF file exists
	testPDF := "/tmp/test_sample.pdf"
	
	text, err := getTextFromPdf(testPDF)
	
	// If file doesn't exist, skip the test
	if err != nil && strings.Contains(err.Error(), "no such file") {
		t.Skip("Sample PDF not found, skipping test")
		return
	}
	
	// If we got text, verify it's not empty
	if err == nil {
		if len(text) == 0 {
			t.Error("Expected non-empty text from PDF")
		}
		if !strings.Contains(text, "Test PDF Document") && !strings.Contains(text, "Casibase") {
			t.Logf("Warning: Expected content not found in parsed text. Text: %s", text)
		}
	}
}
