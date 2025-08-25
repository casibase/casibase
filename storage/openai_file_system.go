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
	"github.com/sashabaranov/go-openai"
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

	file, err := client.CreateFileBytes(ctx, openai.FileBytesRequest{
		Name:    url.PathEscape(fileName),
		Bytes:   fileBuffer.Bytes(),
		Purpose: openai.PurposeAssistants,
	})
	if err != nil {
		return "", err
	}
	_, err = client.CreateVectorStoreFile(ctx, p.vectorStoreId, openai.VectorStoreFileRequest{
		FileID: file.ID,
	})
	if err != nil {
		return "", err
	}

	object := &Object{
		Key:          key,
		Url:          "",
		LastModified: time.Now().Format(time.RFC3339),
		Size:         int64(file.Bytes),
	}
	return addFileToCache(file.ID, p.storeId, object)
}

func (p *OpenAIFileSystemStorageProvider) DeleteObject(key string) error {
	ctx := context.Background()
	client := model.GetOpenAiClientFromToken(p.clientSecret)

	fileId := getCachedFileId(p.storeId, key)
	err := client.DeleteVectorStoreFile(ctx, p.vectorStoreId, fileId)
	if err != nil {
		return err
	}
	removeFileFromCache(p.storeId, key)
	err = client.DeleteFile(ctx, fileId)
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
	client := model.GetOpenAiClientFromToken(clientSecret)
	limit := 100
	storeFiles, err := client.ListVectorStoreFiles(context.Background(), vectorStoreId, openai.Pagination{
		Limit: &limit,
	})
	if err != nil {
		return nil, err
	}

	hasNext := storeFiles.HasMore
	for hasNext {
		files, err := client.ListVectorStoreFiles(context.Background(), vectorStoreId, openai.Pagination{
			Limit: &limit,
			After: storeFiles.LastID,
		})
		if err != nil {
			return nil, err
		}
		storeFiles.VectorStoreFiles = append(storeFiles.VectorStoreFiles, files.VectorStoreFiles...)
		hasNext = files.HasMore
	}

	allFiles, err := client.ListFiles(context.Background())
	if err != nil {
		return nil, err
	}

	allFileMap := make(map[string]string)
	for _, file := range allFiles.Files {
		allFileMap[file.ID] = file.FileName
	}

	currentFileMap := make(map[string]CachedFile)
	for _, file := range storeFiles.VectorStoreFiles {
		fileName, err := url.PathUnescape(allFileMap[file.ID])
		if err != nil {
			return nil, err
		}

		if strings.Contains(fileName, "_hidden.ini.txt") {
			fileName = strings.Replace(fileName, "_hidden.ini.txt", "_hidden.ini", 1)
		}

		currentFileMap[fileName] = CachedFile{
			FileId: file.ID,
			Object: Object{
				Key:          fileName,
				LastModified: time.Unix(file.CreatedAt, 0).Format(time.RFC3339),
				Size:         int64(file.UsageBytes),
				Url:          "",
			},
		}
	}

	return currentFileMap, nil
}
