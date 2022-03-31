package controllers

func (c *ApiController) GetPosts() {
	c.Data["json"] = "OK"
	c.ServeJSON()
}
