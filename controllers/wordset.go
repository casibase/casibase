package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/object"
	"github.com/casbin/casbase/util"
)

func (c *ApiController) GetGlobalWordsets() {
	c.Data["json"] = object.GetGlobalWordsets()
	c.ServeJSON()
}

func (c *ApiController) GetWordsets() {
	owner := c.Input().Get("owner")

	c.Data["json"] = object.GetWordsets(owner)
	c.ServeJSON()
}

func (c *ApiController) GetWordset() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetWordset(id)
	c.ServeJSON()
}

func (c *ApiController) GetWordsetGraph() {
	id := c.Input().Get("id")
	clusterNumber := util.ParseInt(c.Input().Get("clusterNumber"))
	distanceLimit := util.ParseInt(c.Input().Get("distanceLimit"))

	c.Data["json"] = object.GetWordsetGraph(id, clusterNumber, distanceLimit)
	c.ServeJSON()
}

func (c *ApiController) GetWordsetMatch() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetWordsetMatch(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateWordset() {
	id := c.Input().Get("id")

	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateWordset(id, &wordset)
	c.ServeJSON()
}

func (c *ApiController) AddWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddWordset(&wordset)
	c.ServeJSON()
}

func (c *ApiController) DeleteWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteWordset(&wordset)
	c.ServeJSON()
}
