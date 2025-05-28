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

package object

import (
	"bytes"
	"strings"

	"github.com/casibase/casibase/storage"
)

type SubpathStorageProvider struct {
	provider storage.StorageProvider
	subpath  string
}

func NewSubpathStorageProvider(provider storage.StorageProvider, subpath string) *SubpathStorageProvider {
	return &SubpathStorageProvider{
		provider: provider,
		subpath:  strings.Trim(subpath, "/"),
	}
}

// ListObjects Implements the StorageProvider interface, automatically prepending the subpath prefix in each method
func (w *SubpathStorageProvider) ListObjects(prefix string) ([]*storage.Object, error) {
	// Combine the subpath with the provided prefix
	fullPrefix := w.buildFullPath(prefix)
	objects, err := w.provider.ListObjects(fullPrefix)
	if err != nil {
		return nil, err
	}

	// If there's a subpath, remove it from the returned object keys
	if w.subpath != "" {
		for _, obj := range objects {
			if strings.HasPrefix(obj.Key, w.subpath+"/") {
				obj.Key = strings.TrimPrefix(obj.Key, w.subpath+"/")
			}
		}
	}

	return objects, nil
}

func (w *SubpathStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	// Prepend the subpath to the key
	fullKey := w.buildFullPath(key)
	return w.provider.PutObject(user, parent, fullKey, fileBuffer)
}

func (w *SubpathStorageProvider) DeleteObject(key string) error {
	// Prepend the subpath to the key
	fullKey := w.buildFullPath(key)
	return w.provider.DeleteObject(fullKey)
}

// Constructs the full path by combining subpath and path
func (w *SubpathStorageProvider) buildFullPath(path string) string {
	if w.subpath == "" {
		return path
	}

	if path == "" {
		return w.subpath
	}

	return w.subpath + "/" + strings.TrimPrefix(path, "/")
}
