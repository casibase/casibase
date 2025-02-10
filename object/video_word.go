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

package object

import (
	"fmt"
	"unicode"

	"github.com/casibase/casibase/util"
	"github.com/wangbin/jiebago"
)

var seg *jiebago.Segmenter = nil

func isPunctuation(r rune) bool {
	return !unicode.IsLetter(r) && !unicode.IsNumber(r)
}

func isNumber(s string) bool {
	for _, r := range s {
		if !unicode.IsNumber(r) {
			return false
		}
	}
	return true
}

func (v *Video) PopulateWordCountMap() error {
	if len(v.Segments) == 0 {
		return nil
	}

	dictPath := "data/dict.txt"
	if !util.FileExist(dictPath) {
		return fmt.Errorf("Cannot generate word cloud, the dict file: [%s] does not exist", dictPath)
	}

	if seg == nil {
		seg = &jiebago.Segmenter{}
		err := seg.LoadDictionary(dictPath)
		if err != nil {
			return err
		}
	}

	v.WordCountMap = map[string]int{}
	for _, segment := range v.Segments {
		words := seg.Cut(segment.Text, true)
		for word := range words {
			if len(word) > 3 && !isPunctuation([]rune(word)[0]) && !isNumber(word) {
				v.WordCountMap[word]++
			}
		}
	}

	return nil
}
