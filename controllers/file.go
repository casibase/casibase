package controllers

import (
	"encoding/json"
	"mime/multipart"

	"github.com/casbin/casibase/object"
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
		c.ResponseError(err.Error())
		return
	}

	res := object.UpdateFile(storeId, key, &file)
	if res {
		addRecordForFile(c, userName, "Update", storeId, key, "", true)
	}

	c.ResponseOk(res)
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

	res, bs, err := object.AddFile(storeId, key, isLeaf, filename, file)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		addFileToCache(key, filename, bs)
		addRecordForFile(c, userName, "Add", storeId, key, filename, isLeaf)
	}

	c.ResponseOk(res)
}

func (c *ApiController) DeleteFile() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"

	res, err := object.DeleteFile(storeId, key, isLeaf)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if res {
		addRecordForFile(c, userName, "Delete", storeId, key, "", isLeaf)
	}

	c.ResponseOk(res)
}
