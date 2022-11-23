package controllers

import (
	"fmt"
	"strings"

	"github.com/casbin/casbase/util"
)

var cacheDir = "C:/casbase_cache"

func addFileToCache(key string, filename string, bs []byte) {
	if strings.HasPrefix(filename, "ECG_") || strings.HasPrefix(filename, "EEG_") || strings.HasPrefix(filename, "Impedance_") {
		path := fmt.Sprintf("%s/%s/%s", cacheDir, key, filename)
		util.EnsureFileFolderExists(path)
		util.WriteBytesToPath(bs, path)
	}
}
