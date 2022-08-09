// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package util

import (
	"io/ioutil"
	"strconv"

	"github.com/huichen/sego"
	"github.com/mozillazg/go-slugify"
)

func ParseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err)
	}

	return i
}

func IntToString(i int) string {
	return strconv.Itoa(i)
}

func ReadStringFromPath(path string) string {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	return string(data)
}

func WriteStringToPath(s string, path string) {
	err := ioutil.WriteFile(path, []byte(s), 0o644)
	if err != nil {
		panic(err)
	}
}

var Segmenter sego.Segmenter

func InitSegmenter() {
	return
	// load dictionary
	Segmenter.LoadDictionary("dictionary/dictionary.txt")
}

// SplitWords split string into single words.
func SplitWords(str string) []string {
	res := []string{}
	if Segmenter.Dictionary() != nil {
		res = sego.SegmentsToSlice(Segmenter.Segment([]byte(str)), true)
	}
	return res
}

func ConvertToPinyin(content string) string {
	return slugify.Slugify(content)
}
