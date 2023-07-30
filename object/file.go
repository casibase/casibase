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

package object

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/casbin/casibase/storage"
)

func UpdateFile(storeId string, key string, file *File) bool {
	return true
}

func AddFile(storeId string, key string, isLeaf bool, filename string, file multipart.File) (bool, []byte, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return false, nil, err
	}
	if store == nil {
		return false, nil, nil
	}

	var objectKey string
	var fileBuffer *bytes.Buffer
	if isLeaf {
		objectKey = fmt.Sprintf("%s/%s", key, filename)
		objectKey = strings.TrimLeft(objectKey, "/")
		fileBuffer = bytes.NewBuffer(nil)
		_, err = io.Copy(fileBuffer, file)
		if err != nil {
			return false, nil, err
		}

		bs := fileBuffer.Bytes()
		err = storage.PutObject(store.StorageProvider, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	} else {
		objectKey = fmt.Sprintf("%s/%s/_hidden.ini", key, filename)
		objectKey = strings.TrimLeft(objectKey, "/")
		fileBuffer = bytes.NewBuffer(nil)
		bs := fileBuffer.Bytes()
		err = storage.PutObject(store.StorageProvider, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	}
}

func DeleteFile(storeId string, key string, isLeaf bool) (bool, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return false, err
	}
	if store == nil {
		return false, nil
	}

	if isLeaf {
		err = storage.DeleteObject(store.StorageProvider, key)
		if err != nil {
			return false, err
		}
	} else {
		objects, err := storage.ListObjects(store.StorageProvider, key)
		if err != nil {
			return false, err
		}

		for _, object := range objects {
			err = storage.DeleteObject(store.StorageProvider, object.Key)
			if err != nil {
				return false, err
			}
		}
	}
	return true, nil
}
