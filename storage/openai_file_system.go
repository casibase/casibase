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
	"bytes"
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/casibase/casibase/model"
	"github.com/openai/openai-go/v2"
)

type OpenAIFileSystemStorageProvider struct {
	clientSecret  string
	storeId       string
	vectorStoreId string
}

func NewOpenAIFileSystemStorageProvider(vectorStoreId string, clientSecret string) (*OpenAIFileSystemStorageProvider, error) {
	return &OpenAIFileSystemStorageProvider{vectorStoreId: vectorStoreId, clientSecret: clientSecret}, nil
}

func (p *OpenAIFileSystemStorageProvider) ListObjects(prefix string) ([]*Object, error) {
	objects, _, err := p.getCachedFiles(prefix)
	return objects, err
}

func (p *OpenAIFileSystemStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	ctx := context.Background()

	fileName := key
	if strings.Contains(key, "_hidden.ini") {
		fileName = strings.Replace(key, "_hidden.ini", "_hidden.ini.txt", 1)
		fileBuffer.WriteString("this is a folder")
	}

	file, err := client.Files.New(ctx, openai.FileNewParams{
		File:    openai.File(fileBuffer, url.PathEscape(fileName), "application/json"),
		Purpose: openai.FilePurposeAssistants,
	})
	if err != nil {
		return "", err
	}
	_, err = client.VectorStores.Files.New(ctx, p.vectorStoreId, openai.VectorStoreFileNewParams{
		FileID: file.ID,
	})
	if err != nil {
		return "", err
	}

	object := &Object{
		Key:          key,
		Url:          "",
		LastModified: time.Now().Format(time.RFC3339),
		Size:         file.Bytes,
	}
	return addFileToCache(file.ID, p.storeId, object)
}

func (p *OpenAIFileSystemStorageProvider) DeleteObject(key string) error {
	ctx := context.Background()
	client := model.GetOpenAiClientFromToken(p.clientSecret)

	fileId := getCachedFileId(p.storeId, key)
	_, err := client.VectorStores.Files.Delete(ctx, p.vectorStoreId, fileId)
	if err != nil {
		return err
	}
	removeFileFromCache(p.storeId, key)
	_, err = client.Files.Delete(ctx, fileId)
	if err != nil {
		return err
	}

	return nil
}

func (p *OpenAIFileSystemStorageProvider) getCachedFiles(prefix string) ([]*Object, []CachedFile, error) {
	var objects []*Object
	var cachedFiles []CachedFile
	if FileCache[p.storeId] == nil {
		currentFileMap, err := getOpenaiFileObjects(p.clientSecret, p.vectorStoreId)
		if err != nil {
			return nil, nil, err
		}
		FileCache[p.storeId] = currentFileMap
	}
	for key, cachedFile := range FileCache[p.storeId] {
		if strings.HasPrefix(key, prefix) {
			objects = append(objects, &cachedFile.Object)
			cachedFiles = append(cachedFiles, cachedFile)
		}
	}
	return objects, cachedFiles, nil
}

func getOpenaiFileObjects(clientSecret string, vectorStoreId string) (map[string]CachedFile, error) {
	ctx := context.Background()
	client := model.GetOpenAiClientFromToken(clientSecret)

	FileMap := make(map[string]string)
	fp := client.Files.ListAutoPaging(ctx, openai.FileListParams{})
	for fp.Next() {
		f := fp.Current()
		FileMap[f.ID] = f.Filename
	}
	if err := fp.Err(); err != nil {
		return nil, err
	}

	currentFileMap := make(map[string]CachedFile)
	vp := client.VectorStores.Files.ListAutoPaging(ctx, vectorStoreId, openai.VectorStoreFileListParams{
		Limit: openai.Int(100),
	})
	for vp.Next() {
		vf := vp.Current()

		fileName := FileMap[vf.ID]
		if fileName == "" {
			continue
		}
		fileNameDecoded, err := url.PathUnescape(fileName)
		if err != nil {
			return nil, err
		}
		if strings.Contains(fileNameDecoded, "_hidden.ini.txt") {
			fileNameDecoded = strings.Replace(fileNameDecoded, "_hidden.ini.txt", "_hidden.ini", 1)
		}

		currentFileMap[fileNameDecoded] = CachedFile{
			FileId: vf.ID,
			Object: Object{
				Key:          fileNameDecoded,
				LastModified: time.Unix(vf.CreatedAt, 0).Format(time.RFC3339),
				Size:         vf.UsageBytes,
				Url:          "",
			},
		}
	}
	if err := vp.Err(); err != nil {
		return nil, err
	}

	return currentFileMap, nil
}
