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
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"strings"
)

func UpdateFile(storeId string, key string, file *File) bool {
	return true
}

// addSubPath adds storage sub path prefix to the object key
func (store *Store) addSubPath(key string) string {
	if store.StorageSubpath == "" {
		return strings.TrimLeft(key, "/")
	}
	subPath := strings.Trim(store.StorageSubpath, "/")
	return fmt.Sprintf("%s/%s", subPath, strings.TrimLeft(key, "/"))
}

func AddFile(storeId string, userName string, key string, isLeaf bool, filename string, file multipart.File) (bool, []byte, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return false, nil, err
	}
	if store == nil {
		return false, nil, nil
	}

	storageProviderObj, err := store.GetStorageProviderObj()
	if err != nil {
		return false, nil, err
	}

	var objectKey string
	var fileBuffer *bytes.Buffer
	if isLeaf {
		objectKey = fmt.Sprintf("%s/%s", key, filename)
		objectKey = store.addSubPath(objectKey)
		fileBuffer = bytes.NewBuffer(nil)
		_, err = io.Copy(fileBuffer, file)
		if err != nil {
			return false, nil, err
		}

		bs := fileBuffer.Bytes()
		_, err = storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	} else {
		objectKey = fmt.Sprintf("%s/%s/_hidden.ini", key, filename)
		objectKey = store.addSubPath(objectKey)
		fileBuffer = bytes.NewBuffer(nil)
		bs := fileBuffer.Bytes()
		_, err = storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
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

	storageProviderObj, err := store.GetStorageProviderObj()
	if err != nil {
		return false, err
	}

	if isLeaf {
		objectKey := store.addSubPath(key)
		err = storageProviderObj.DeleteObject(objectKey)
		if err != nil {
			return false, err
		}
	} else {
		prefix := store.addSubPath(key)
		if !strings.HasSuffix(prefix, "/") {
			prefix += "/"
		}

		objects, err := storageProviderObj.ListObjects(prefix)
		if err != nil {
			return false, err
		}

		for _, object := range objects {
			err = storageProviderObj.DeleteObject(object.Key)
			if err != nil {
				return false, err
			}
		}
	}
	return true, nil
}
