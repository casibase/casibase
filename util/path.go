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

package util

import (
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

func FileExist(path string) bool {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func GetPath(path string) string {
	return filepath.Dir(path)
}

func EnsureFileFolderExists(path string) {
	p := GetPath(path)
	if !FileExist(p) {
		err := os.MkdirAll(p, os.ModePerm)
		if err != nil {
			panic(err)
		}
	}
}

func RemoveExt(filename string) string {
	return filename[:len(filename)-len(filepath.Ext(filename))]
}

func ListFiles(path string) []string {
	res := []string{}

	files, err := ioutil.ReadDir(path)
	if err != nil {
		panic(err)
	}

	for _, f := range files {
		if !f.IsDir() {
			res = append(res, f.Name())
		}
	}

	return res
}

func FilterQuery(urlString string, blackList []string) string {
	urlData, err := url.Parse(urlString)
	if err != nil {
		return urlString
	}

	queries := urlData.Query()
	retQuery := make(url.Values)
	inBlackList := false
	for key, value := range queries {
		inBlackList = false
		for _, blackListItem := range blackList {
			if blackListItem == key {
				inBlackList = true
				break
			}
		}
		if !inBlackList {
			retQuery[key] = value
		}
	}
	if len(retQuery) > 0 {
		return urlData.Path + "?" + strings.ReplaceAll(retQuery.Encode(), "%2F", "/")
	} else {
		return urlData.Path
	}
}

func CopyFile(dest string, src string) {
	bs, err := os.ReadFile(src)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile(dest, bs, 0o644)
	if err != nil {
		panic(err)
	}
}
