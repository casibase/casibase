package controllers

import (
	"encoding/json"

	"github.com/casbin/casibase/object"
)

func (c *ApiController) GetGlobalStores() {
	stores, err := object.GetGlobalStores()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(stores)
}

func (c *ApiController) GetStores() {
	owner := c.Input().Get("owner")

	stores, err := object.GetStores(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(stores)
}

func (c *ApiController) GetStore() {
	id := c.Input().Get("id")

	store, err := object.GetStore(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if store == nil {
		c.ResponseError("store is empty")
		return
	}

	store.Populate()
	c.ResponseOk(store)
}

func (c *ApiController) UpdateStore() {
	id := c.Input().Get("id")

	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateStore(id, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	sucess, err := object.AddStore(&store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(sucess)
}

func (c *ApiController) DeleteStore() {
	var store object.Store
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	sucess, err := object.DeleteStore(&store)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(sucess)
}
