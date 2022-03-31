package controllers

import "github.com/astaxie/beego"

type ApiController struct {
	beego.Controller
}

func (c *ApiController) GetSessionUser() string {
	user := c.GetSession("username")
	if user == nil {
		return ""
	}

	return user.(string)
}

func (c *ApiController) SetSessionUser(user string) {
	c.SetSession("username", user)
}
