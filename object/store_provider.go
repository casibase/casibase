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
	"strings"

	"github.com/casibase/casibase/storage"
)

func (store *Store) createPathIfNotExisted(tokens []string, size int64, url string, lastModifiedTime string, isLeaf bool) {
	currentFile := store.FileTree
	for i, token := range tokens {
		if currentFile.Children == nil {
			currentFile.Children = []*TreeFile{}
		}
		if currentFile.ChildrenMap == nil {
			currentFile.ChildrenMap = map[string]*TreeFile{}
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
		newFile := &TreeFile{
			Key:         key,
			Title:       token,
			IsLeaf:      isLeafTmp,
			Url:         url,
			Children:    []*TreeFile{},
			ChildrenMap: map[string]*TreeFile{},
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

func isObjectLeaf(object *storage.Object) bool {
	isLeaf := true
	if object.Key[len(object.Key)-1] == '/' {
		isLeaf = false
	}
	return isLeaf
}

func (store *Store) Populate(origin string, lang string) error {
	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return err
	}

	objects, err := storageProviderObj.ListObjects("")
	if err != nil {
		return err
	}

	if store.FileTree == nil {
		store.FileTree = &TreeFile{
			Key:         "/",
			Title:       store.DisplayName,
			CreatedTime: store.CreatedTime,
			IsLeaf:      false,
			Url:         "",
			Children:    []*TreeFile{},
			ChildrenMap: map[string]*TreeFile{},
		}
	}

	sortedObjects := []*storage.Object{}
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
		lastModifiedTime := object.LastModified
		isLeaf := isObjectLeaf(object)
		size := object.Size

		var url string
		url, err = getUrlFromPath(object.Url, origin)
		if err != nil {
			return err
		}

		tokens := strings.Split(strings.Trim(object.Key, "/"), "/")
		store.createPathIfNotExisted(tokens, size, url, lastModifiedTime, isLeaf)

		// fmt.Printf("%s, %d, %v\n", object.Key, object.Size, object.LastModified)
	}

	return nil
}

func (store *Store) GetVideoData(lang string) ([]string, error) {
	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return nil, err
	}

	objects, err := storageProviderObj.ListObjects("2023/视频附件")
	if err != nil {
		return nil, err
	}

	res := []string{}
	for _, object := range objects {
		if strings.HasSuffix(object.Key, "/_hidden.ini") {
			continue
		}

		url := fmt.Sprintf("%s/%s", store.StorageProvider, object.Key)
		res = append(res, url)
	}

	return res, nil
}

func SyncDefaultProvidersToStore(store *Store) error {
	defaultStore, err := GetDefaultStore("admin")
	if err != nil {
		return err
	}
	if defaultStore == nil {
		return nil
	}

	if store.ImageProvider == "" && defaultStore.ImageProvider != "" {
		store.ImageProvider = defaultStore.ImageProvider
	}
	if store.TextToSpeechProvider == "Browser Built-In" && defaultStore.TextToSpeechProvider != "" {
		store.TextToSpeechProvider = defaultStore.TextToSpeechProvider
	}
	if store.SpeechToTextProvider == "Browser Built-In" && defaultStore.SpeechToTextProvider != "" {
		store.SpeechToTextProvider = defaultStore.SpeechToTextProvider
	}
	if store.AgentProvider == "" && defaultStore.AgentProvider != "" {
		store.AgentProvider = defaultStore.AgentProvider
	}

	return nil
}
