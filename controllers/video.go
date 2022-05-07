package controllers

import (
	"encoding/json"

	"github.com/casbin/casbase/object"
)

func (c *ApiController) GetGlobalVideos() {
	c.Data["json"] = object.GetGlobalVideos()
	c.ServeJSON()
}

func (c *ApiController) GetVideos() {
	owner := c.Input().Get("owner")

	c.Data["json"] = object.GetVideos(owner)
	c.ServeJSON()
}

func (c *ApiController) GetVideo() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetVideo(id)
	c.ServeJSON()
}

func (c *ApiController) UpdateVideo() {
	id := c.Input().Get("id")

	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.UpdateVideo(id, &video)
	c.ServeJSON()
}

func (c *ApiController) AddVideo() {
	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.AddVideo(&video)
	c.ServeJSON()
}

func (c *ApiController) DeleteVideo() {
	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		panic(err)
	}

	c.Data["json"] = object.DeleteVideo(&video)
	c.ServeJSON()
}
