package controllers

import (
	"encoding/json"
	"mime/multipart"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) UpdateFile() {
	storeId := c.Input().Get("store")
	key := c.Input().Get("key")

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateFile(storeId, key, &file)
	c.ServeJSON()
}

func (c *ApiController) AddFile() {
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

	c.Data["json"] = object.AddFile(storeId, key, isLeaf, filename, file)
	c.ServeJSON()
}

func (c *ApiController) DeleteFile() {
	storeId := c.Input().Get("store")
	key := c.Input().Get("key")
	isLeaf := c.Input().Get("isLeaf") == "1"

	c.Data["json"] = object.DeleteFile(storeId, key, isLeaf)
	c.ServeJSON()
}
