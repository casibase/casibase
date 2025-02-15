// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package controllers

import (
	"fmt"
	"strings"

	"github.com/beego/beego"
	"github.com/casibase/casibase/util"
)

var (
	cacheDir string
	appDir   string
	cacheMap = map[string]string{}
)

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

// ActivateFile
// @Title ActivateFile
// @Tag File API
// @Description activate file
// @Param key query string true "The key of the file"
// @Param filename query string true "The name of the file"
// @Success 200 {object} controllers.Response The Response object
// @router /activate-file [post]
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

// GetActiveFile
// @Title GetActiveFile
// @Tag File API
// @Description get active file
// @Param prefix query string true "The prefix of the file"
// @Success 200 {string} string "get active file"
// @router /get-active-file [get]
func (c *ApiController) GetActiveFile() {
	prefix := c.Input().Get("prefix")

	res := ""
	if v, ok := cacheMap[prefix]; ok {
		res = v
	}

	c.ResponseOk(res)
}
