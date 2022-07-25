package object

import (
	"fmt"

	"github.com/casbin/casbase/storage"
)

func UpdateFile(storeId string, key string, file *File) bool {
	return true
}

func AddFile(storeId string, file *File) bool {
	store := GetStore(storeId)
	if store == nil {
		return false
	}

	objectKey := fmt.Sprintf("%s/_hidden.ini", file.Key)
	storage.PutObject(store.Bucket, objectKey)
	return true
}

func DeleteFile(storeId string, file *File) bool {
	store := GetStore(storeId)
	if store == nil {
		return false
	}

	objectKey := fmt.Sprintf("%s", file.Key)
	storage.DeleteObject(store.Bucket, objectKey)
	return true
}
