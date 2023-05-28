package object

import (
	"fmt"
	"strings"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/casbin/casbase/storage"
)

func (store *Store) createPathIfNotExisted(tokens []string, size int64, lastModifiedTime string, isLeaf bool) {
	currentFile := store.FileTree
	for i, token := range tokens {
		if currentFile.Children == nil {
			currentFile.Children = []*File{}
		}
		if currentFile.ChildrenMap == nil {
			currentFile.ChildrenMap = map[string]*File{}
		}

		tmpFile, ok := currentFile.ChildrenMap[token]
		if ok {
			currentFile = tmpFile
			continue
		}

		isLeafTmp := false
		if i == len(tokens)-1 {
			isLeafTmp = isLeaf
		}

		key := strings.Join(tokens[:i+1], "/")
		newFile := &File{
			Key:         key,
			Title:       token,
			IsLeaf:      isLeafTmp,
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}

		if i == len(tokens)-1 {
			newFile.Size = size
			newFile.CreatedTime = lastModifiedTime

			if token == "_hidden.ini" {
				continue
			}
		} else if i == len(tokens)-2 {
			if tokens[len(tokens)-1] == "_hidden.ini" {
				newFile.CreatedTime = lastModifiedTime
			}
		}

		currentFile.Children = append(currentFile.Children, newFile)
		currentFile.ChildrenMap[token] = newFile
		currentFile = newFile
	}
}

func isObjectLeaf(object *oss.ObjectProperties) bool {
	isLeaf := true
	if object.Key[len(object.Key)-1] == '/' {
		isLeaf = false
	}
	return isLeaf
}

func (store *Store) Populate() {
	objects := storage.ListObjects(store.Bucket, "")

	if store.FileTree == nil {
		store.FileTree = &File{
			Key:         "/",
			Title:       store.DisplayName,
			CreatedTime: store.CreatedTime,
			IsLeaf:      false,
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}
	}

	sortedObjects := []oss.ObjectProperties{}
	for _, object := range objects {
		if strings.HasSuffix(object.Key, "/_hidden.ini") {
			sortedObjects = append(sortedObjects, object)
		}
	}
	for _, object := range objects {
		if !strings.HasSuffix(object.Key, "/_hidden.ini") {
			sortedObjects = append(sortedObjects, object)
		}
	}

	for _, object := range sortedObjects {
		lastModifiedTime := object.LastModified.Local().Format(time.RFC3339)
		isLeaf := isObjectLeaf(&object)
		size := object.Size

		tokens := strings.Split(strings.Trim(object.Key, "/"), "/")
		store.createPathIfNotExisted(tokens, size, lastModifiedTime, isLeaf)

		//fmt.Printf("%s, %d, %v\n", object.Key, object.Size, object.LastModified)
	}
}

func (store *Store) GetVideoData() []string {
	objects := storage.ListObjects(store.Bucket, "2023/视频附件")

	res := []string{}
	for _, object := range objects {
		if strings.HasSuffix(object.Key, "/_hidden.ini") {
			continue
		}

		url := fmt.Sprintf("%s/%s", store.Domain, object.Key)
		res = append(res, url)
	}

	return res
}
