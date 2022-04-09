package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) GetGlobalVectorsets() {
	c.Data["json"] = object.GetGlobalVectorsets()
	c.ServeJSON()
}

func (c *ApiController) GetVectorsets() {
	owner := c.Input().Get("owner")

	c.Data["json"] = object.GetVectorsets(owner)
	c.ServeJSON()
}

func (c *ApiController) GetVectorset() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetVectorset(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateVectorset() {
	id := c.Input().Get("id")

	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateVectorset(id, &vectorset)
	c.ServeJSON()
}

func (c *ApiController) AddVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddVectorset(&vectorset)
	c.ServeJSON()
}

func (c *ApiController) DeleteVectorset() {
	var vectorset object.Vectorset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &vectorset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteVectorset(&vectorset)
	c.ServeJSON()
}
