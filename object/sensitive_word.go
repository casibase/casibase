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

package object

import "strings"

type SensitiveWord struct {
	Word string `xorm:"varchar(64) notnull"`
	Id   int64
}

var sensitiveWords []SensitiveWord

func loadSensitiveWords() {
	if len(sensitiveWords) == 0 {
		err := adapter.Engine.Desc("word").Find(&sensitiveWords)
		if err != nil {
			panic(err)
		}
	}
}

func AddSensitiveWord(word string) {
	if IsSensitiveWord(word) {
		return
	}
	_, err := adapter.Engine.Insert(SensitiveWord{Word: word})
	if err != nil {
		panic(err)
	}
	sensitiveWords = nil
	err = adapter.Engine.Desc("word").Find(&sensitiveWords)
	if err != nil {
		panic(err)
	}
}

func DeleteSensitiveWord(word string) {
	_, err := adapter.Engine.Delete(SensitiveWord{Word: word})
	if err != nil {
		panic(err)
	}
	sensitiveWords = nil
	err = adapter.Engine.Desc("word").Find(&sensitiveWords)
	if err != nil {
		panic(err)
	}
}

func IsSensitiveWord(word string) bool {
	loadSensitiveWords()
	for _, wordObj := range sensitiveWords {
		if word == wordObj.Word {
			return true
		}
	}
	return false
}

func GetSensitiveWords() []string {
	loadSensitiveWords()
	var ret []string
	for _, wordObj := range sensitiveWords {
		ret = append(ret, wordObj.Word)
	}
	return ret
}

func ContainsSensitiveWord(str string) bool {
	loadSensitiveWords()
	for _, wordObj := range sensitiveWords {
		if strings.Index(str, wordObj.Word) >= 0 {
			return true
		}
	}
	return false
}
