package controllers

import (
	"encoding/json"

	"github.com/casbin/casibase/object"
)

func (c *ApiController) GetGlobalVectorsets() {
	vectorsets, err := object.GetGlobalVectorsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorsets)
}

func (c *ApiController) GetVectorsets() {
	owner := c.Input().Get("owner")

	vectorsets, err := object.GetVectorsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorsets)
}

func (c *ApiController) GetVectorset() {
	id := c.Input().Get("id")

	vectorset, err := object.GetVectorset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(vectorset)
}

func (c *ApiController) UpdateVectorset() {
	id := c.Input().Get("id")

	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVectorset(id, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) AddVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddVectorset(&vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func (c *ApiController) DeleteVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVectorset(&vectorset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}
