package storage

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/casibase/casibase/util"
)

type LocalFileSystemStorageProvider struct {
	path string
}

func NewLocalFileSystemStorageProvider(path string) (*LocalFileSystemStorageProvider, error) {
	path = strings.ReplaceAll(path, "\\", "/")
	return &LocalFileSystemStorageProvider{path: path}, nil
}

func (p *LocalFileSystemStorageProvider) ListObjects(prefix string) ([]*Object, error) {
	objects := []*Object{}
	fullPath := p.path

	// Handle subpath prefix
	if prefix != "" {
		fullPath = filepath.Join(p.path, prefix)
		util.EnsureFileFolderExists(fullPath)
		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			err = os.Mkdir(fullPath, os.ModePerm)
			if err != nil {
				return nil, err
			}
		}
	}

	filepath.Walk(fullPath, func(path string, info os.FileInfo, err error) error {
		if path == fullPath {
			return nil
		}

		base := filepath.Base(path)
		if info.IsDir() && (strings.HasPrefix(base, ".") || base == "node_modules") {
			return filepath.SkipDir
		}

		if err == nil && !info.IsDir() {
			modTime := info.ModTime()
			path = strings.ReplaceAll(path, "\\", "/")
			searchPath := strings.ReplaceAll(fullPath, "\\", "/")
			relativePath := strings.TrimPrefix(path, searchPath)
			relativePath = strings.TrimPrefix(relativePath, "/")

			if prefix != "" {
				relativePath = prefix + "/" + relativePath
			}

			objects = append(objects, &Object{
				Key:          relativePath,
				LastModified: modTime.Format(time.RFC3339),
				Size:         info.Size(),
				Url:          path,
			})
		}
		return nil
	})

	return objects, nil
}

func (p *LocalFileSystemStorageProvider) PutObject(user string, parent string, key string, fileBuffer *bytes.Buffer) (string, error) {
	fullPath := filepath.Join(p.path, key)
	err := os.MkdirAll(filepath.Dir(fullPath), os.ModePerm)
	if err != nil {
		return "", err
	}

	dst, err := os.Create(filepath.Clean(fullPath))
	if err != nil {
		return "", err
	}
	defer dst.Close()

	_, err = io.Copy(dst, fileBuffer)
	return fullPath, err
}

func (p *LocalFileSystemStorageProvider) DeleteObject(key string) error {
	return os.Remove(filepath.Join(p.path, key))
}
