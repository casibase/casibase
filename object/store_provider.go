package object

import (
	"strings"
	"time"

	"github.com/casbin/casbase/util"
	"github.com/casdoor/casdoor/storage"
)

func (store *Store) createPathIfNotExisted(tokens []string, lastModifiedTime string, lastIsLeaf bool) {
	currentFile := store.FileTree
	if currentFile == nil {
		currentFile = &File{
			Key:          "/",
			Title:        "",
			ModifiedTime: util.GetCurrentTime(),
			IsLeaf:       false,
			Children:     []*File{},
			ChildrenMap:  map[string]*File{},
		}
		store.FileTree = currentFile
	}

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

		isLeaf := false
		if i == len(tokens)-1 {
			isLeaf = lastIsLeaf
		}

		key := strings.Join(tokens[:i+1], "/")
		newFile := &File{
			Key:         key,
			Title:       token,
			IsLeaf:      isLeaf,
			Children:    []*File{},
			ChildrenMap: map[string]*File{},
		}

		if i == len(tokens)-1 {
			newFile.ModifiedTime = lastModifiedTime
		}

		currentFile.Children = append(currentFile.Children, newFile)
		currentFile.ChildrenMap[token] = newFile
		currentFile = newFile
	}
}

func (store *Store) Populate() {
	storageProvider := storage.GetStorageProvider(providerType, clientId, clientSecret, region, store.Bucket, endpoint)
	objects, _ := storageProvider.List("")
	for _, object := range objects {
		lastModifiedTime := object.LastModified.Local().Format(time.RFC3339)

		lastIsLeaf := true
		if object.Path[len(object.Path)-1] == '/' {
			lastIsLeaf = false
		}

		tokens := strings.Split(strings.Trim(object.Path, "/"), "/")
		store.createPathIfNotExisted(tokens, lastModifiedTime, lastIsLeaf)

		//fmt.Printf("%s, %s, %v\n", object.Path, object.Name, object.LastModified)
	}
}
