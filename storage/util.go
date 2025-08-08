package storage

import (
	"net/url"
	"path"
)

func escapePath(p string) string { return url.PathEscape(p) }

func unescapePath(s string) (string, error) { return url.PathUnescape(s) }

func getKeyParentPath(key string) string {
	return key[:len(key)-len(path.Base(key))]
}
