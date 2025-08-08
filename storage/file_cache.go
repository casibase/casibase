// Copyright 2025 The Casibase Authors. All Rights Reserved.
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

package storage

import (
	"strings"
)

var FileCache = make(map[string]map[string]CachedFile)

type CachedFile struct {
	FileId           string
	MirrorFileObject *Object
}

func getCachedFiles(storeId string, clientSecret string, mirrorProvider StorageProvider, prefix string) ([]*Object, error) {
	var objects []*Object
	if FileCache[storeId] == nil {
		tempFileMap := make(map[string]CachedFile)
		err := getOpenaiFileObjects(clientSecret, mirrorProvider, tempFileMap, prefix)
		if err != nil {
			return nil, err
		}
		FileCache[storeId] = tempFileMap
	}
	for key, cachedFile := range FileCache[storeId] {
		if strings.HasPrefix(key, prefix) {
			objects = append(objects, cachedFile.MirrorFileObject)
		}
	}
	return objects, nil
}

func getCachedFileId(storeId string, key string) string {
	cachedFileMap, exists := FileCache[storeId]
	if !exists {
		return ""
	}
	cachedFile, exists := cachedFileMap[key]
	if !exists {
		return ""
	}
	return cachedFile.FileId
}

func addFileToCache(fileId string, storeId string, mirrorFileObject *Object) (string, error) {
	FileCache[storeId][mirrorFileObject.Key] = CachedFile{
		FileId:           fileId,
		MirrorFileObject: mirrorFileObject,
	}
	return mirrorFileObject.Url, nil
}

func removeFileFromCache(storeId string, key string) {
	if storeCache, exists := FileCache[storeId]; exists {
		delete(storeCache, key)
	}
}

func ClearStoreCacheFiles(storeId string) {
	if _, exists := FileCache[storeId]; exists {
		delete(FileCache, storeId)
	}
}

func DeleteThirdVectorStoreStorage(providerType string, clientSecret string, vectorStoreId string, storeId string) error {
	if providerType == "OpenAI File System" {
		err := deleteOpenaiVectorStore(vectorStoreId, clientSecret)
		if err != nil {
			return err
		}
	}
	ClearStoreCacheFiles(storeId)
	return nil
}
