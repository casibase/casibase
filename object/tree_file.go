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

	"github.com/casibase/casibase/util"
)

func UpdateTreeFile(storeId string, key string, file *TreeFile) bool {
	return true
}

func AddTreeFile(storeId string, userName string, key string, isLeaf bool, filename string, file multipart.File, lang string) (bool, []byte, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return false, nil, err
	}
	if store == nil {
		return false, nil, nil
	}

	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return false, nil, err
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
		_, err = storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		// Persist file information in the file table
		err = createFileRecord(store.Owner, store.Name, objectKey, filename, int64(len(bs)), store.StorageProvider, lang)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	} else {
		objectKey = fmt.Sprintf("%s/%s/_hidden.ini", key, filename)
		objectKey = strings.TrimLeft(objectKey, "/")
		fileBuffer = bytes.NewBuffer(nil)
		bs := fileBuffer.Bytes()
		_, err = storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	}
}

func DeleteTreeFile(storeId string, key string, isLeaf bool, lang string) (bool, error) {
	store, err := GetStore(storeId)
	if err != nil {
		return false, err
	}
	if store == nil {
		return false, nil
	}

	storageProviderObj, err := store.GetStorageProviderObj(lang)
	if err != nil {
		return false, err
	}

	if isLeaf {
		err = storageProviderObj.DeleteObject(key)
		if err != nil {
			return false, err
		}

		// Delete file record from the file table
		owner, name := util.GetOwnerAndNameFromIdNoCheck(storeId)
		_ = deleteFileRecordByPath(owner, name, key)
	} else {
		objects, err := storageProviderObj.ListObjects(key)
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

func createFileRecord(owner string, storeName string, path string, filename string, size int64, storageProvider string, lang string) error {
	// Generate a unique name for the file record
	name := fmt.Sprintf("file_%s", util.GetRandomName())

	fileRecord := &File{
		Owner:           owner,
		Name:            name,
		CreatedTime:     util.GetCurrentTime(),
		DisplayName:     filename,
		Filename:        filename,
		Path:            path,
		Size:            size,
		Store:           storeName,
		StorageProvider: storageProvider,
		TokenCount:      0,
		Status:          "Pending", // Initial status before embedding
	}

	_, err := AddFile(fileRecord)
	return err
}

func deleteFileRecordByPath(owner string, storeName string, path string) error {
	// Find and delete file record by path
	files, err := GetFilesByStore(owner, storeName)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.Path == path {
			_, err = DeleteFile(file)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
