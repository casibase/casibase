package controllers

import (
	"fmt"
	"strings"

	"github.com/astaxie/beego"
	"github.com/casbin/casibase/util"
)

var cacheDir string
var appDir string
var cacheMap = map[string]string{}

func init() {
	cacheDir = beego.AppConfig.String("cacheDir")
	appDir = beego.AppConfig.String("appDir")
}

func getAppPath(filename string) string {
	return fmt.Sprintf("%s/%s.ctf", appDir, filename)
}

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
		c.ResponseOk(false)
		return
	}

	path := fmt.Sprintf("%s/%s", cacheDir, key)
	cacheMap[prefix] = path
	fmt.Printf("%v\n", cacheMap)

	if !util.FileExist(getAppPath(filename)) {
		util.CopyFile(getAppPath(filename), getAppPath(prefix))
	}

	c.ResponseOk(true)
}

func (c *ApiController) GetActiveFile() {
	prefix := c.Input().Get("prefix")

	res := ""
	if v, ok := cacheMap[prefix]; ok {
		res = v
	}

	c.ResponseOk(res)
}
