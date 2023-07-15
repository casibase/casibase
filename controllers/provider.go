package controllers

import (
	"encoding/json"

	"github.com/casbin/casibase/object"
)

func (c *ApiController) GetGlobalProviders() {
	providers, err := object.GetGlobalProviders()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(providers)
}

func (c *ApiController) GetProviders() {
	owner := c.Input().Get("owner")

	providers, err := object.GetProviders(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(providers)
}

func (c *ApiController) GetProvider() {
	id := c.Input().Get("id")

	provider, err := object.GetProvider(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(provider)
}

func (c *ApiController) UpdateProvider() {
	id := c.Input().Get("id")

	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateProvider(id, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddProvider() {
	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddProvider(&provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteProvider() {
	var provider object.Provider
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteProvider(&provider)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
