package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/casdoor"
)

func (c *ApiController) GetPermissions() {
	owner := c.Input().Get("owner")

	c.Data["json"] = casdoor.GetPermissions(owner)
	c.ServeJSON()
}

func (c *ApiController) GetPermission() {
	id := c.Input().Get("id")

	c.Data["json"] = casdoor.GetPermission(id)
	c.ServeJSON()
}

func (c *ApiController) UpdatePermission() {
	id := c.Input().Get("id")

	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = casdoor.UpdatePermission(id, &permission)
	c.ServeJSON()
}

func (c *ApiController) AddPermission() {
	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = casdoor.AddPermission(&permission)
	c.ServeJSON()
}

func (c *ApiController) DeletePermission() {
	var permission casdoor.Permission
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &permission)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = casdoor.DeletePermission(&permission)
	c.ServeJSON()
}
