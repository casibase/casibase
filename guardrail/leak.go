// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
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

package guardrail

import (
	"unicode"
)

const leakWindow = 15

func leakRunes(text string) []rune {
	runes := []rune{}
	for _, r := range text {
		if unicode.IsSpace(r) || unicode.IsPunct(r) || isInvisible(r) {
			continue
		}
		runes = append(runes, unicode.ToLower(r))
	}
	return runes
}

// LeaksPrompt reports whether an answer reproduces a large part of the agent's
// system prompt word for word, ignoring spacing and punctuation. Short prompts
// are not checked, and a prompt that asks for a fixed sentence in every answer
// stays well under the threshold.
func LeaksPrompt(answer string, prompt string) bool {
	p := leakRunes(prompt)
	if len(p) < 50 {
		return false
	}
	a := leakRunes(answer)
	if len(a) < leakWindow {
		return false
	}

	windows := make(map[string]bool, len(a))
	for i := 0; i+leakWindow <= len(a); i++ {
		windows[string(a[i:i+leakWindow])] = true
	}

	covered := make([]bool, len(p))
	for i := 0; i+leakWindow <= len(p); i++ {
		if windows[string(p[i:i+leakWindow])] {
			for j := i; j < i+leakWindow; j++ {
				covered[j] = true
			}
		}
	}
	count := 0
	for _, c := range covered {
		if c {
			count++
		}
	}
	return count >= 300 || (count >= 40 && count*10 >= len(p)*4)
}
