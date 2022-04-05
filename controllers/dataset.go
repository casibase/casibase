package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) GetGlobalDatasets() {
	c.Data["json"] = object.GetGlobalDatasets()
	c.ServeJSON()
}

func (c *ApiController) GetDatasets() {
	owner := c.Input().Get("owner")

	c.Data["json"] = object.GetDatasets(owner)
	c.ServeJSON()
}

func (c *ApiController) GetDataset() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetDataset(id)
	c.ServeJSON()
}

func (c *ApiController) GetDatasetGraph() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetDatasetGraph(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateDataset() {
	id := c.Input().Get("id")

	var dataset object.Dataset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &dataset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateDataset(id, &dataset)
	c.ServeJSON()
}

func (c *ApiController) AddDataset() {
	var dataset object.Dataset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &dataset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddDataset(&dataset)
	c.ServeJSON()
}

func (c *ApiController) DeleteDataset() {
	var dataset object.Dataset
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &dataset)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteDataset(&dataset)
	c.ServeJSON()
}
