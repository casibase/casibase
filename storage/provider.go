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

package storage

import "bytes"

type Object struct {
	Key          string
	LastModified string
	Size         int64
	Url          string
}

type StorageProvider interface {
	ListObjects(prefix string) ([]*Object, error)
	PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error)
	DeleteObject(key string) error
}

func GetStorageProvider(typ string, clientId string, clientSecret string, providerName string, vectorStoreId string) (StorageProvider, error) {
	var p StorageProvider
	var err error
	if typ == "Local File System" {
		p, err = NewLocalFileSystemStorageProvider(clientId)
	} else if typ == "OpenAI File System" {
		p, err = NewOpenAIFileSystemStorageProvider(vectorStoreId, clientSecret)
	} else {
		p, err = NewCasdoorProvider(providerName)
	}

	if err != nil {
		return nil, err
	}
	return p, nil
}
