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
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

const (
	KindPhone  = "phone"
	KindIdCard = "id_card"
	KindSecret = "secret"
)

var (
	phonePattern  = regexp.MustCompile(`(?:\+?86[- ]?)?1[3-9]\d(?:[- ]?\d{4}){2}`)
	idCardPattern = regexp.MustCompile(`[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]`)
	// A data URL or a link may contain long digit runs that only look like a phone number.
	urlPattern = regexp.MustCompile(`(?:https?://|data:)[^\s<>"'）)]+`)

	secretPatterns = []*regexp.Regexp{
		regexp.MustCompile(`-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z ]+ )?PRIVATE KEY-----|$)`),
		regexp.MustCompile(`\bsk-[A-Za-z0-9_-]{20,}`),
		regexp.MustCompile(`\bAKIA[0-9A-Z]{16}\b`),
		regexp.MustCompile(`\bLTAI[0-9A-Za-z]{12,30}\b`),
		regexp.MustCompile(`\bxox[baprs]-[A-Za-z0-9-]{10,}`),
		regexp.MustCompile(`\bgh[pousr]_[A-Za-z0-9]{20,}`),
		regexp.MustCompile(`\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}`),
	}
)

var idCardWeights = []int{7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2}

func isValidIdCard(id string) bool {
	if len(id) != 18 {
		return false
	}
	sum := 0
	for i := 0; i < 17; i++ {
		sum += int(id[i]-'0') * idCardWeights[i]
	}
	return "10X98765432"[sum%11] == strings.ToUpper(id[17:])[0]
}

func isWordRune(r rune) bool {
	return r < utf8.RuneSelf && (unicode.IsDigit(r) || unicode.IsLetter(r))
}

// standsAlone reports whether text[start:end] is not part of a longer number or word.
func standsAlone(text string, start int, end int) bool {
	if start > 0 {
		r, _ := utf8.DecodeLastRuneInString(text[:start])
		if isWordRune(r) {
			return false
		}
	}
	if end < len(text) {
		r, _ := utf8.DecodeRuneInString(text[end:])
		if isWordRune(r) || strings.ContainsRune("元万亿个人米克吨次倍%", r) {
			return false
		}
	}
	return true
}

func maskKeep(value string, head int, tail int) string {
	runes := []rune(value)
	if len(runes) <= head+tail {
		return strings.Repeat("*", len(runes))
	}
	return string(runes[:head]) + strings.Repeat("*", len(runes)-head-tail) + string(runes[len(runes)-tail:])
}

func maskOutsideUrls(text string, mask func(string) string) string {
	spans := urlPattern.FindAllStringIndex(text, -1)
	if len(spans) == 0 {
		return mask(text)
	}
	var b strings.Builder
	last := 0
	for _, span := range spans {
		b.WriteString(mask(text[last:span[0]]))
		b.WriteString(text[span[0]:span[1]])
		last = span[1]
	}
	b.WriteString(mask(text[last:]))
	return b.String()
}

// MaskSensitive masks mainland mobile numbers (138****5678), resident ID card
// numbers with a valid check digit (110***********123X) and credentials such as
// API keys and private keys. It returns the masked text and the kinds it found,
// in a stable order, or nil when nothing was masked. Links are left alone.
func MaskSensitive(text string) (string, []string) {
	found := map[string]bool{}

	masked := maskOutsideUrls(text, func(part string) string {
		part = replaceStandalone(part, idCardPattern, func(m string) (string, bool) {
			if !isValidIdCard(m) {
				return m, false
			}
			found[KindIdCard] = true
			return maskKeep(m, 3, 4), true
		})
		part = replaceStandalone(part, phonePattern, func(m string) (string, bool) {
			digits := strings.NewReplacer("-", "", " ", "", "+", "").Replace(m)
			digits = strings.TrimPrefix(digits, "86")
			if len(digits) != 11 || looksLikeQuantity(digits) {
				return m, false
			}
			found[KindPhone] = true
			return maskPhoneDigits(m), true
		})
		for _, re := range secretPatterns {
			part = re.ReplaceAllStringFunc(part, func(m string) string {
				found[KindSecret] = true
				if strings.HasPrefix(m, "-----BEGIN") {
					return "-----BEGIN PRIVATE KEY----- ****"
				}
				return maskKeep(m, 4, 0)
			})
		}
		return part
	})

	if len(found) == 0 {
		return text, nil
	}
	kinds := []string{}
	for _, kind := range []string{KindPhone, KindIdCard, KindSecret} {
		if found[kind] {
			kinds = append(kinds, kind)
		}
	}
	return masked, kinds
}

// maskPhoneDigits masks the 4th to 7th digits of the number and keeps the
// prefix and separators as written, "+86 139-1234-5678" -> "+86 139-****-5678".
func maskPhoneDigits(m string) string {
	runes := []rune(m)
	seen := 0
	for i := len(runes) - 1; i >= 0 && seen < 11; i-- {
		if runes[i] < '0' || runes[i] > '9' {
			continue
		}
		seen++
		if seen >= 5 && seen <= 8 {
			runes[i] = '*'
		}
	}
	return string(runes)
}

// looksLikeQuantity skips round numbers such as 15000000000 that show up in
// math answers; a real phone number rarely has six zeros after its prefix.
func looksLikeQuantity(digits string) bool {
	return strings.Count(digits[3:], "0") >= 6
}

func replaceStandalone(text string, re *regexp.Regexp, replace func(string) (string, bool)) string {
	spans := re.FindAllStringIndex(text, -1)
	if len(spans) == 0 {
		return text
	}
	var b strings.Builder
	last := 0
	for _, span := range spans {
		b.WriteString(text[last:span[0]])
		m := text[span[0]:span[1]]
		if standsAlone(text, span[0], span[1]) {
			m, _ = replace(m)
		}
		b.WriteString(m)
		last = span[1]
	}
	b.WriteString(text[last:])
	return b.String()
}
