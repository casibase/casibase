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

//go:build !skipCi
// +build !skipCi

package i18n

import "testing"

func applyToOtherLanguage(dataEn *I18nData, lang string) {
	dataOther := readI18nFile(lang)
	println(dataOther)

	applyData(dataEn, dataOther)
	writeI18nFile(lang, dataEn)
}

func TestGenerateI18nStrings(t *testing.T) {
	dataEn := parseToData()
	writeI18nFile("en", dataEn)

	applyToOtherLanguage(dataEn, "zh")
	applyToOtherLanguage(dataEn, "fr")
	applyToOtherLanguage(dataEn, "de")
	applyToOtherLanguage(dataEn, "id")
	applyToOtherLanguage(dataEn, "ja")
	applyToOtherLanguage(dataEn, "ko")
	applyToOtherLanguage(dataEn, "ru")
	applyToOtherLanguage(dataEn, "es")
}
