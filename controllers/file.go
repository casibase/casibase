package controllers

import (
	"encoding/json"

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

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddFile(storeId, &file)
	c.ServeJSON()
}

func (c *ApiController) DeleteFile() {
	storeId := c.Input().Get("store")

	var file object.File
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteFile(storeId, &file)
	c.ServeJSON()
}
