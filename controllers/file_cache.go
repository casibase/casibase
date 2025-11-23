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

	"github.com/beego/beego/logs"
	"github.com/casibase/casibase/conf"
	"github.com/casibase/casibase/util"
)

var (
	cacheDir string
	appDir   string
	cacheMap = map[string]string{}
)

func init() {
	cacheDir = conf.GetConfigString("cacheDir")
	appDir = conf.GetConfigString("appDir")
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

func addFileToCache(key string, filename string, bs []byte) error {
	prefix := getCachePrefix(filename)
	if prefix == "" {
		return nil
	}

	path := fmt.Sprintf("%s/%s/%s", cacheDir, key, filename)
	util.EnsureFileFolderExists(path)
	err := util.WriteBytesToPath(bs, path)
	return err
}

// ActivateFile
// @Title ActivateFile
// @Tag File API
// @Description Activate a cached file by mapping its cache key to filename prefix. Used for file caching mechanism to improve performance when repeatedly accessing files. Copies file to application path if not present. Requires user authentication.
// @Param   key       query    string  true    "Cache key identifying the file in cache directory, e.g., 'abc123def456'"
// @Param   filename  query    string  true    "Filename with extension to determine prefix, e.g., 'document.pdf'"
// @Success 200 {object} controllers.Response "Successfully activated file cache, returns true on success or false if prefix not determined"
// @Failure 400 {object} controllers.Response "Bad request: Invalid key or filename"
// @Failure 401 {object} controllers.Response "Unauthorized: Login required"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to activate file cache"
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
	logs.Info("%v", cacheMap)

	if !util.FileExist(getAppPath(filename)) {
		util.CopyFile(getAppPath(filename), getAppPath(prefix))
	}

	c.ResponseOk(true)
}

// GetActiveFile
// @Title GetActiveFile
// @Tag File API
// @Description Get the cache path for an active file by its prefix. Returns the cached file path if the file has been activated, or empty string if not found in cache. Used to check if a file is cached and get its cache location.
// @Param   prefix    query    string  true    "File prefix to look up in cache map, e.g., 'document'"
// @Success 200 {string} string "Successfully returns cache path string (e.g., 'cache/abc123') or empty string if not cached"
// @Failure 400 {object} controllers.Response "Bad request: Invalid prefix parameter"
// @Failure 500 {object} controllers.Response "Internal server error: Failed to retrieve cache information"
// @router /get-active-file [get]
func (c *ApiController) GetActiveFile() {
	prefix := c.Input().Get("prefix")

	res := ""
	if v, ok := cacheMap[prefix]; ok {
		res = v
	}

	c.ResponseOk(res)
}
