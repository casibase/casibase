// Copyright 2023 The casbin Authors. All Rights Reserved.
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
	"strings"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/casbin/casibase/storage"
)

func (store *Store) createPathIfNotExisted(tokens []string, size int64, lastModifiedTime string, isLeaf bool) {
	currentFile := store.FileTree
	for i, token := range tokens {
		if currentFile.Children == nil {
			currentFile.Children = []*File{}
		}
		if currentFile.ChildrenMap == nil {
			currentFile.ChildrenMap = map[string]*File{}
		}

		tmpFile, ok := currentFile.ChildrenMap[token]
		if ok {
			currentFile = tmpFile
			continue
		}

		isLeafTmp := false
		if i == len(tokens)-1 {
			isLeafTmp = isLeaf
		}

		key := strings.Join(tokens[:i+1], "/")
		newFile := &File{
			Key:         key,
			Title:       token,
			IsLeaf:      isLeafTmp,
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}

		if i == len(tokens)-1 {
			newFile.Size = size
			newFile.CreatedTime = lastModifiedTime

			if token == "_hidden.ini" {
				continue
			}
		} else if i == len(tokens)-2 {
			if tokens[len(tokens)-1] == "_hidden.ini" {
				newFile.CreatedTime = lastModifiedTime
			}
		}

		currentFile.Children = append(currentFile.Children, newFile)
		currentFile.ChildrenMap[token] = newFile
		currentFile = newFile
	}
}

func isObjectLeaf(object *oss.ObjectProperties) bool {
	isLeaf := true
	if object.Key[len(object.Key)-1] == '/' {
		isLeaf = false
	}
	return isLeaf
}

func (store *Store) Populate() error {
	objects, err := storage.ListObjects(store.Bucket, "")
	if err != nil {
		return err
	}

	if store.FileTree == nil {
		store.FileTree = &File{
			Key:         "/",
			Title:       store.DisplayName,
			CreatedTime: store.CreatedTime,
			IsLeaf:      false,
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}
	}

	sortedObjects := []oss.ObjectProperties{}
	for _, object := range objects {
		if strings.HasSuffix(object.Key, "/_hidden.ini") {
			sortedObjects = append(sortedObjects, object)
		}
	}
	for _, object := range objects {
		if !strings.HasSuffix(object.Key, "/_hidden.ini") {
			sortedObjects = append(sortedObjects, object)
		}
	}

	for _, object := range sortedObjects {
		lastModifiedTime := object.LastModified.Local().Format(time.RFC3339)
		isLeaf := isObjectLeaf(&object)
		size := object.Size

		tokens := strings.Split(strings.Trim(object.Key, "/"), "/")
		store.createPathIfNotExisted(tokens, size, lastModifiedTime, isLeaf)

		//fmt.Printf("%s, %d, %v\n", object.Key, object.Size, object.LastModified)
	}

	return nil
}

func (store *Store) GetVideoData() ([]string, error) {
	objects, err := storage.ListObjects(store.Bucket, "2023/视频附件")
	if err != nil {
		return nil, err
	}

	res := []string{}
	for _, object := range objects {
		if strings.HasSuffix(object.Key, "/_hidden.ini") {
			continue
		}

		url := fmt.Sprintf("%s/%s", store.Domain, object.Key)
		res = append(res, url)
	}

	return res, nil
}
