package object

import (
	"fmt"

	"github.com/casbin/casbase/storage"
)

func UpdateFile(storeId string, key string, file *File) bool {
	return true
}

func AddFile(storeId string, key string, newFolder string) bool {
	store := GetStore(storeId)
	if store == nil {
		return false
	}

	objectKey := fmt.Sprintf("%s/%s/_hidden.ini", key, newFolder)
	storage.PutObject(store.Bucket, objectKey)
	return true
}

func DeleteFile(storeId string, key string, isLeaf bool) bool {
	store := GetStore(storeId)
	if store == nil {
		return false
	}

	if isLeaf {
		objectKey := fmt.Sprintf("%s", key)
		storage.DeleteObject(store.Bucket, objectKey)
		return true
	} else {
		return false
	}
}
