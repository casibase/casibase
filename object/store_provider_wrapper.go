package object

import (
	"bytes"
	"strings"

	"github.com/casibase/casibase/storage"
)

type StorageProviderWrapper struct {
	provider storage.StorageProvider
	subpath  string
}

func NewStorageProviderWrapper(provider storage.StorageProvider, subpath string) *StorageProviderWrapper {
	return &StorageProviderWrapper{
		provider: provider,
		subpath:  strings.Trim(subpath, "/"),
	}
}

// ListObjects Implements the StorageProvider interface, automatically prepending the subpath prefix in each method
func (w *StorageProviderWrapper) ListObjects(prefix string) ([]*storage.Object, error) {
	// Combine the subpath with the provided prefix
	fullPrefix := w.buildFullPath(prefix)
	objects, err := w.provider.ListObjects(fullPrefix)
	if err != nil {
		return nil, err
	}

	// If there's a subpath, remove it from the returned object keys
	if w.subpath != "" {
		for _, obj := range objects {
			if strings.HasPrefix(obj.Key, w.subpath+"/") {
				obj.Key = strings.TrimPrefix(obj.Key, w.subpath+"/")
			}
		}
	}

	return objects, nil
}

func (w *StorageProviderWrapper) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	// Prepend the subpath to the key
	fullKey := w.buildFullPath(key)
	return w.provider.PutObject(user, parent, fullKey, fileBuffer)
}

func (w *StorageProviderWrapper) DeleteObject(key string) error {
	// Prepend the subpath to the key
	fullKey := w.buildFullPath(key)
	return w.provider.DeleteObject(fullKey)
}

// Constructs the full path by combining subpath and path
func (w *StorageProviderWrapper) buildFullPath(path string) string {
	if w.subpath == "" {
		return path
	}

	if path == "" {
		return w.subpath
	}

	return w.subpath + "/" + strings.TrimPrefix(path, "/")
}
