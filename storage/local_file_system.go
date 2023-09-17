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

package storage

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type LocalFileSystemStorageProvider struct {
	path string
}

func NewLocalFileSystemStorageProvider(path string) (*LocalFileSystemStorageProvider, error) {
	path = strings.ReplaceAll(path, "\\", "/")
	return &LocalFileSystemStorageProvider{path: path}, nil
}

func (p *LocalFileSystemStorageProvider) ListObjects(prefix string) ([]*Object, error) {
	objects := []*Object{}
	fullPath := p.path

	filepath.Walk(fullPath, func(path string, info os.FileInfo, err error) error {
		if path == fullPath {
			return nil
		}

		base := filepath.Base(path)
		if info.IsDir() && (strings.HasPrefix(base, ".") || base == "node_modules") {
			return filepath.SkipDir
		}

		if err == nil && !info.IsDir() {
			modTime := info.ModTime()
			path = strings.ReplaceAll(path, "\\", "/")
			relativePath := strings.TrimPrefix(path, fullPath)
			relativePath = strings.TrimPrefix(relativePath, "/")
			objects = append(objects, &Object{
				Key:          relativePath,
				LastModified: modTime.Format(time.RFC3339),
				Size:         info.Size(),
				Url:          "",
			})
		}
		return nil
	})

	return objects, nil
}

func (p *LocalFileSystemStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) error {
	fullPath := p.path

	err := os.MkdirAll(filepath.Dir(fullPath), os.ModePerm)
	if err != nil {
		return fmt.Errorf("Casdoor fails to create folder: \"%s\" for local file system storage provider: %s. Make sure Casdoor process has correct permission to create/access it, or you can create it manually in advance", filepath.Dir(fullPath), err.Error())
	}

	dst, err := os.Create(filepath.Clean(fullPath))
	if err == nil {
		_, err = io.Copy(dst, fileBuffer)
	}
	return err
}

func (p *LocalFileSystemStorageProvider) DeleteObject(key string) error {
	return os.Remove(filepath.Join(p.path, key))
}
