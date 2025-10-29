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

package i18n

import (
	"strings"
	"testing"
)

func TestTranslate(t *testing.T) {
	// Test with a supported language
	result := Translate("en", "test:Hello World")
	if result == "" {
		t.Error("Expected non-empty result for supported language")
	}

	// Test with an unsupported language (should fall back to English)
	result = Translate("it", "test:Hello World")
	// Should not contain error message
	if strings.Contains(result, "Translate error") {
		t.Errorf("Expected fallback to English, but got error: %s", result)
	}

	// Test with another unsupported language
	result = Translate("pt", "test:Hello World")
	if strings.Contains(result, "Translate error") {
		t.Errorf("Expected fallback to English, but got error: %s", result)
	}
}

func TestTranslateFallback(t *testing.T) {
	// Clear langMap to ensure fresh test
	langMap = make(map[string]map[string]map[string]string)

	// Test that unsupported language falls back to English
	result := Translate("it", "object:the model provider type: %s is not supported")
	
	// The result should not contain "Translate error"
	if strings.Contains(result, "Translate error") {
		t.Errorf("Expected fallback to English, but got error: %s", result)
	}
	
	// The result should contain the actual translation or the key text
	if result == "" {
		t.Error("Expected non-empty result after fallback to English")
	}
}
