package object

import "github.com/casbin/casbase/storage"

func UpdateFile(storeId string, key string, file *File) bool {
	return true
}

func AddFile(storeId string, file *File) bool {
	affected, err := adapter.engine.Insert(file)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func DeleteFile(storeId string, file *File) bool {
	store := GetStore(storeId)
	if store == nil {
		return false
	}

	storage.DeleteObject(store.Bucket, file.Key)
	return true
}
