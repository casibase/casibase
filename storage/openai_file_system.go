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
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/casibase/casibase/model"
	"github.com/sashabaranov/go-openai"
)

type OpenAIFileSystemStorageProvider struct {
	clientSecret          string
	mirrorStorageProvider StorageProvider
}

func NewOpenAIFileSystemStorageProvider(clientSecret string, mirrorStorageProvider StorageProvider) (*OpenAIFileSystemStorageProvider, error) {
	return &OpenAIFileSystemStorageProvider{clientSecret: clientSecret, mirrorStorageProvider: mirrorStorageProvider}, nil
}

func (p *OpenAIFileSystemStorageProvider) ListObjects(prefix string) ([]*Object, error) {
	if p.mirrorStorageProvider == nil {
		return nil, fmt.Errorf("mirror storage provider is not set")
	}
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	ctx := context.Background()
	files, err := client.ListFiles(ctx)
	if err != nil {
		return nil, err
	}
	mirrorFiles, err := p.mirrorStorageProvider.ListObjects(prefix)
	if err != nil {
		return nil, err
	}

	mirrorFilesMap := make(map[string]*Object)
	for _, file := range mirrorFiles {
		fileName := path.Base(file.Key)
		mirrorFilesMap[fileName] = file
	}

	objects := []*Object{}
	for _, file := range files.Files {
		mirrorFile, ok := mirrorFilesMap[file.FileName]
		if !ok {
			continue
		}
		objects = append(objects, &Object{
			Id:           file.ID,
			Key:          mirrorFile.Key,
			LastModified: time.Unix(file.CreatedAt, 0).Format(time.RFC3339),
			Size:         int64(file.Bytes),
			Url:          mirrorFile.Url,
		})
	}
	return objects, nil
}

func (p *OpenAIFileSystemStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	if p.mirrorStorageProvider == nil {
		return "", fmt.Errorf("mirror storage provider is not set")
	}
	if strings.Contains(key, "_hidden.ini") {
		return "", errors.New("not support update for folder")
	}
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	ctx := context.Background()
	_, err := client.GetFile(ctx, key)
	if err == nil {
		err := client.DeleteFile(ctx, key)
		if err != nil {
			return "", err
		}
	}

	_, err = client.CreateFileBytes(ctx, openai.FileBytesRequest{
		Name:    key,
		Bytes:   fileBuffer.Bytes(),
		Purpose: openai.PurposeAssistants,
	})
	if err != nil {
		return "", err
	}
	return p.mirrorStorageProvider.PutObject(user, parent, key, fileBuffer)
}

func (p *OpenAIFileSystemStorageProvider) DeleteObject(key string, fileId string) error {
	if p.mirrorStorageProvider == nil {
		return fmt.Errorf("mirror storage provider is not set")
	}
	client := model.GetOpenAiClientFromToken(p.clientSecret)
	err := client.DeleteFile(context.Background(), fileId)
	if err != nil {
		return err
	}
	return p.mirrorStorageProvider.DeleteObject(key, fileId)
}
