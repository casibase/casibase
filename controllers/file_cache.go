package controllers

import (
	"fmt"
	"strings"

	"github.com/casbin/casbase/util"
)

var cacheDir = "C:/casbase_cache"
var cacheMap = map[string]string{}

func getCachePrefix(filename string) string {
	if !strings.HasPrefix(filename, "ECG_") && !strings.HasPrefix(filename, "EEG_") && !strings.HasPrefix(filename, "Impedance_") {
		return ""
	}

	tokens := strings.SplitN(filename, "_", 2)
	res := tokens[0]
	return res
}

func addFileToCache(key string, filename string, bs []byte) {
	prefix := getCachePrefix(filename)
	if prefix == "" {
		return
	}

	path := fmt.Sprintf("%s/%s/%s", cacheDir, key, filename)
	util.EnsureFileFolderExists(path)
	util.WriteBytesToPath(bs, path)
}

func (c *ApiController) ActivateFile() {
	_, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	key := c.Input().Get("key")
	filename := c.Input().Get("filename")

	prefix := getCachePrefix(filename)
	if prefix == "" {
		c.Data["json"] = false
		c.ServeJSON()
		return
	}

	path := fmt.Sprintf("%s/%s", cacheDir, key)
	cacheMap[prefix] = path
	fmt.Printf("%v\n", cacheMap)

	c.Data["json"] = true
	c.ServeJSON()
}

func (c *ApiController) GetActiveFile() {
	prefix := c.Input().Get("prefix")

	res := ""
	if v, ok := cacheMap[prefix]; ok {
		res = v
	}

	c.Data["json"] = res
	c.ServeJSON()
}
