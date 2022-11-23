package controllers

import (
	"encoding/json"
	"mime/multipart"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) UpdateFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		panic(err)
	}

	res := object.UpdateFile(storeId, key, &file)
	if res {
		addRecordForFile(c, userName, "Update", storeId, key, "", true)
	}

	c.Data["json"] = res
	c.ServeJSON()
}

func (c *ApiController) AddFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"
	filename := c.Input().Get("filename")
	var file multipart.File

	if isLeaf {
		var err error
		file, _, err = c.GetFile("file")
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
		defer file.Close()
	}

	res, bs := object.AddFile(storeId, key, isLeaf, filename, file)
	if res {
		addFileToCache(key, filename, bs)
		addRecordForFile(c, userName, "Add", storeId, key, filename, isLeaf)
	}

	c.Data["json"] = res
	c.ServeJSON()
}

func (c *ApiController) DeleteFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"

	res := object.DeleteFile(storeId, key, isLeaf)
	if res {
		addRecordForFile(c, userName, "Delete", storeId, key, "", isLeaf)
	}

	c.Data["json"] = res
	c.ServeJSON()
}
