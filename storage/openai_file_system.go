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
	"path"
	"strings"
	"time"

	"github.com/casibase/casibase/model"
	"github.com/sashabaranov/go-openai"
)

type OpenAIFileSystemStorageProvider struct {
	clientSecret          string
	mirrorStorageProvider StorageProvider
	storeId               string
	vectorStoreId         string
}

func NewOpenAIFileSystemStorageProvider(vectorStoreId string, clientSecret string, mirrorStorageProvider StorageProvider, storeId string) (*OpenAIFileSystemStorageProvider, error) {
	return &OpenAIFileSystemStorageProvider{vectorStoreId: vectorStoreId, clientSecret: clientSecret, mirrorStorageProvider: mirrorStorageProvider, storeId: storeId}, nil
}

func (p *OpenAIFileSystemStorageProvider) ListObjects(prefix string) ([]*Object, error) {
	return getCachedFiles(p.storeId, p.clientSecret, p.mirrorStorageProvider, prefix)
}

func (p *OpenAIFileSystemStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	ctx := context.Background()
	fileBytes := fileBuffer.Bytes()

	fileUrl, err := p.mirrorStorageProvider.PutObject(user, parent, key, fileBuffer)
	if err != nil {
		return "", err
	}
	url := strings.ReplaceAll(fileUrl, "\\", "/")
	key = getKeyParentPath(key) + path.Base(url)
	var file openai.File
	if !strings.Contains(key, "_hidden.ini") {
		file, err = client.CreateFileBytes(ctx, openai.FileBytesRequest{
			Name:    escapePath(key),
			Bytes:   fileBytes,
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
	}

	object := &Object{
		Key:          key,
		Url:          fileUrl,
		LastModified: time.Now().Format(time.RFC3339),
		Size:         int64(file.Bytes),
	}
	return addFileToCache(file.ID, p.storeId, object)
}

func (p *OpenAIFileSystemStorageProvider) DeleteObject(key string) error {
	ctx := context.Background()
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	fileId := getCachedFileId(p.storeId, key)
	if !strings.Contains(key, "_hidden.ini") && fileId != "" {
		err := client.DeleteFile(ctx, fileId)
		if err != nil {
			return err
		}
		err = client.DeleteVectorStoreFile(ctx, p.vectorStoreId, fileId)
		if err != nil {
			return err
		}
	}

	removeFileFromCache(p.storeId, key)

	err := p.mirrorStorageProvider.DeleteObject(key)
	if err != nil {
		return err
	}
	return nil
}

func getOpenaiFileObjects(clientSecret string, mirrorProvider StorageProvider, storeFileCache map[string]CachedFile, prefix string) error {
	client := model.GetOpenAiClientFromToken(clientSecret)
	ctx := context.Background()
	files, err := client.ListFiles(ctx)
	if err != nil {
		return err
	}

	mirrorFiles, err := mirrorProvider.ListObjects(prefix)
	if err != nil {
		return err
	}

	mirrorFilesMap := make(map[string]*Object)
	for _, file := range mirrorFiles {
		if strings.Contains(file.Key, "_hidden.ini") {
			storeFileCache[file.Key] = CachedFile{
				FileId:           "",
				MirrorFileObject: file,
			}
		}
		mirrorFilesMap[file.Key] = file
	}

	for _, file := range files.Files {
		fileName, err := unescapePath(file.FileName)
		if err != nil {
			return err
		}
		mirrorFile := mirrorFilesMap[fileName]
		if mirrorFile != nil {
			storeFileCache[fileName] = CachedFile{
				FileId:           file.ID,
				MirrorFileObject: mirrorFile,
			}
		}
	}
	return nil
}

func deleteOpenaiVectorStore(vectorStoreId, clientSecret string) error {
	client := model.GetOpenAiClientFromToken(clientSecret)
	ctx := context.Background()

	_, err := client.DeleteVectorStore(ctx, vectorStoreId)
	if err != nil {
		return err
	}
	return nil
}
