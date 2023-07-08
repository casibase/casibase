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
		storage.PutObject(store.Bucket, objectKey, fileBuffer)
		return true, bs, nil
	} else {
		objectKey = fmt.Sprintf("%s/%s/_hidden.ini", key, filename)
		objectKey = strings.TrimLeft(objectKey, "/")
		fileBuffer = bytes.NewBuffer(nil)
		bs := fileBuffer.Bytes()
		storage.PutObject(store.Bucket, objectKey, fileBuffer)
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
		storage.DeleteObject(store.Bucket, key)
	} else {
		objects := storage.ListObjects(store.Bucket, key)
		for _, object := range objects {
			storage.DeleteObject(store.Bucket, object.Key)
		}
	}
	return true, nil
}
