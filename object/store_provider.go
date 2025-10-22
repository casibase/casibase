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

func (store *Store) createPathIfNotExisted(tokens []string, size int64, url string, lastModifiedTime string, isLeaf bool, status string) {
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
			Url:         url,
			Status:      status,
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

	if store.FileTree == nil {
		store.FileTree = &File{
			Key:         "/",
			Title:       store.DisplayName,
			CreatedTime: store.CreatedTime,
			IsLeaf:      false,
			Url:         "",
			Status:      "Active",
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}
	}

	// Try to load from FileData table first
	fileDataList, err := GetFileDataByStore(store.Owner, store.Name)
	if err != nil {
		return err
	}

	// If FileData table is empty, populate from storage provider and save to table
	if len(fileDataList) == 0 {
		objects, err := storageProviderObj.ListObjects("")
		if err != nil {
			return err
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
			store.createPathIfNotExisted(tokens, size, url, lastModifiedTime, isLeaf, "Active")

			// Save to FileData table
			if !strings.HasSuffix(object.Key, "/_hidden.ini") {
				fileData := &FileData{
					Owner:       store.Owner,
					Store:       store.Name,
					Key:         object.Key,
					Title:       tokens[len(tokens)-1],
					Size:        size,
					CreatedTime: lastModifiedTime,
					IsLeaf:      isLeaf,
					Url:         url,
					Status:      "Active",
					ParentKey:   "",
				}
				if len(tokens) > 1 {
					fileData.ParentKey = strings.Join(tokens[:len(tokens)-1], "/")
				}
				_, _ = AddFileData(fileData)
			}
		}
	} else {
		// Use FileData from table
		for _, fileData := range fileDataList {
			var url string
			if fileData.IsLeaf {
				url = fileData.Url
				if url == "" {
					url, err = getUrlFromPath(fileData.Key, origin)
					if err != nil {
						return err
					}
				}
			}

			tokens := strings.Split(strings.Trim(fileData.Key, "/"), "/")
			store.createPathIfNotExisted(tokens, fileData.Size, url, fileData.CreatedTime, fileData.IsLeaf, fileData.Status)
		}
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
