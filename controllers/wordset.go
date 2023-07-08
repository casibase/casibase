package controllers

import (
	"encoding/json"

	"github.com/casbin/casibase/object"
	"github.com/casbin/casibase/util"
)

func (c *ApiController) GetGlobalWordsets() {
	wordsets, err := object.GetGlobalWordsets()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

func (c *ApiController) GetWordsets() {
	owner := c.Input().Get("owner")

	wordsets, err := object.GetWordsets(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordsets)
}

func (c *ApiController) GetWordset() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordset(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

func (c *ApiController) GetWordsetGraph() {
	id := c.Input().Get("id")
	clusterNumber := util.ParseInt(c.Input().Get("clusterNumber"))
	distanceLimit := util.ParseInt(c.Input().Get("distanceLimit"))

	g, err := object.GetWordsetGraph(id, clusterNumber, distanceLimit)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(g)
}

func (c *ApiController) GetWordsetMatch() {
	id := c.Input().Get("id")

	wordset, err := object.GetWordsetMatch(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(wordset)
}

func (c *ApiController) UpdateWordset() {
	id := c.Input().Get("id")

	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateWordset(id, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

func (c *ApiController) AddWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}

func (c *ApiController) DeleteWordset() {
	var wordset object.Wordset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteWordset(&wordset)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	c.ResponseOk(success)
}
