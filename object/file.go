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

func UpdateFile(storeId string, key string, file *File) bool {
	owner, storeName := util.GetOwnerAndNameFromId(storeId)

	// Update file data in database
	fileData := &FileData{
		Owner:       owner,
		Store:       storeName,
		Key:         key,
		Title:       file.Title,
		Size:        file.Size,
		CreatedTime: file.CreatedTime,
		IsLeaf:      file.IsLeaf,
		Url:         file.Url,
		Status:      file.Status,
		ParentKey:   "",
	}

	// Extract parent key from the key
	tokens := strings.Split(strings.Trim(key, "/"), "/")
	if len(tokens) > 1 {
		fileData.ParentKey = strings.Join(tokens[:len(tokens)-1], "/")
	}

	success, err := UpdateFileData(owner, storeName, key, fileData)
	if err != nil {
		return false
	}

	return success
}

func AddFile(storeId string, userName string, key string, isLeaf bool, filename string, file multipart.File, lang string) (bool, []byte, error) {
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
		url, err := storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		// Save file data to database
		fileData := &FileData{
			Owner:       store.Owner,
			Store:       store.Name,
			Key:         objectKey,
			Title:       filename,
			Size:        int64(len(bs)),
			CreatedTime: util.GetCurrentTime(),
			IsLeaf:      true,
			Url:         url,
			Status:      "Active",
			ParentKey:   key,
		}
		_, err = AddFileData(fileData)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	} else {
		objectKey = fmt.Sprintf("%s/%s/_hidden.ini", key, filename)
		objectKey = strings.TrimLeft(objectKey, "/")
		fileBuffer = bytes.NewBuffer(nil)
		bs := fileBuffer.Bytes()
		_, err := storageProviderObj.PutObject(userName, store.Name, objectKey, fileBuffer)
		if err != nil {
			return false, nil, err
		}

		// Save directory to database
		dirKey := fmt.Sprintf("%s/%s", key, filename)
		dirKey = strings.TrimLeft(dirKey, "/")
		fileData := &FileData{
			Owner:       store.Owner,
			Store:       store.Name,
			Key:         dirKey,
			Title:       filename,
			Size:        0,
			CreatedTime: util.GetCurrentTime(),
			IsLeaf:      false,
			Url:         "",
			Status:      "Active",
			ParentKey:   key,
		}
		_, err = AddFileData(fileData)
		if err != nil {
			return false, nil, err
		}

		return true, bs, nil
	}
}

func DeleteFile(storeId string, key string, isLeaf bool, lang string) (bool, error) {
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

		// Delete from FileData table
		_, err = DeleteFileData(store.Owner, store.Name, key)
		if err != nil {
			return false, err
		}
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

		// Delete from FileData table (directory and all children)
		_, err = DeleteFileDataByPrefix(store.Owner, store.Name, key)
		if err != nil {
			return false, err
		}
	}
	return true, nil
}
