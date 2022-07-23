package object

import (
	"strings"
	"time"

	"github.com/casbin/casbase/util"
	"github.com/casdoor/casdoor/storage"
	"github.com/casdoor/oss"
)

var storageProvider oss.StorageInterface

func InitStore() {
	storageProvider = storage.GetStorageProvider(providerType, clientId, clientSecret, region, bucket, endpoint)
}

func (store *Store) createPathIfNotExisted(tokens []string, lastModifiedTime string, lastIsLeaf bool) {
	currentFile := store.FileTree
	if currentFile == nil {
		currentFile = &File{
			Title:        "root",
			ModifiedTime: util.GetCurrentTime(),
			IsLeaf:       false,
			Children:     nil,
			ChildrenMap:  nil,
		}
		store.FileTree = currentFile
	}

	for i, token := range tokens {
		if currentFile.ChildrenMap == nil {
			currentFile.ChildrenMap = map[string]*File{}
		}

		file, ok := currentFile.ChildrenMap[token]
		if ok {
			currentFile = file
			continue
		}

		isLeaf := false
		if i == len(tokens)-1 {
			isLeaf = lastIsLeaf
		}

		newFile := &File{
			Key:         strings.Join(tokens, "/"),
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
		currentFile = file
	}
}

func (store *Store) Populate() {
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
