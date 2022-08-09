// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package service

import (
	"sort"
	"unicode/utf8"

	"github.com/huichen/sego"
)

var segmenter sego.Segmenter

type wordfreq struct {
	word string
	num  int
}

func InitDictionary() {
	segmenter.LoadDictionary("./dictionary/dictionary.txt")
}

func Finalword(s string) []string {
	return Keyword(Tokenizer(s))
}

func Tokenizer(s string) []string {
	text := []byte(s)
	segments := segmenter.Segment(text)
	return sego.SegmentsToSlice(segments, false)
}

func Keyword(word []string) []string {
	var filterword, finalword, words []string
	var wordsfreq []wordfreq
	var wordfreq wordfreq

	wordnum := make(map[string]int)
	for _, val := range word {
		if utf8.RuneCountInString(val) > 1 {
			filterword = append(filterword, val)
		}
	}
	if len(filterword) == 0 {
		for _, v := range word {
			wordnum[v] = wordnum[v] + 1
		}
		for s := range wordnum {
			words = append(words, s)
		}
		if len(wordnum) < 5 {
			return words
		} else {
			for i := 0; i < 4; i++ {
				finalword = append(finalword, words[i])
			}
			return finalword
		}
	} else {
		for _, v := range filterword {
			wordnum[v] = wordnum[v] + 1
		}
		for s, v := range wordnum {
			wordfreq.word = s
			wordfreq.num = v
			wordsfreq = append(wordsfreq, wordfreq)
		}
		sort.Slice(wordsfreq, func(i, j int) bool {
			return wordsfreq[i].num > wordsfreq[j].num
		})
		if len(wordsfreq) < 5 {
			for i := 0; i < len(wordsfreq); i++ {
				finalword = append(finalword, wordsfreq[i].word)
			}
		} else {
			for i := 0; i < 4; i++ {
				finalword = append(finalword, wordsfreq[i].word)
			}
		}
		return finalword
	}
}
