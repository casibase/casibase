package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) GetGlobalStores() {
	c.Data["json"] = object.GetGlobalStores()
	c.ServeJSON()
}

func (c *ApiController) GetStores() {
	owner := c.Input().Get("owner")

	c.Data["json"] = object.GetStores(owner)
	c.ServeJSON()
}

func (c *ApiController) GetStore() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetStore(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateStore() {
	id := c.Input().Get("id")

	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateStore(id, &store)
	c.ServeJSON()
}

func (c *ApiController) AddStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddStore(&store)
	c.ServeJSON()
}

func (c *ApiController) DeleteStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteStore(&store)
	c.ServeJSON()
}
