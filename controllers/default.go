package controllers

func (c *ApiController) GetTopPosts() {
	c.Data["json"] = "OK"
	c.ServeJSON()
}
