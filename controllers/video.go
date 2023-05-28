package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/casbin/casbase/object"
	"github.com/casbin/casbase/util"
	"github.com/casbin/casbase/video"
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

func startCoverUrlJob(owner string, name string, videoId string) {
	go func(owner string, name string, videoId string) {
		for i := 0; i < 20; i++ {
			coverUrl := video.GetVideoCoverUrl(videoId)
			if coverUrl != "" {
				video := object.GetVideo(util.GetIdFromOwnerAndName(owner, name))
				if video.CoverUrl != "" {
					break
				}

				video.CoverUrl = coverUrl
				object.UpdateVideo(util.GetIdFromOwnerAndName(owner, name), video)
				break
			}

			time.Sleep(time.Second * 5)
		}
	}(owner, name, videoId)
}

func (c *ApiController) UploadVideo() {
	owner := c.GetSessionUsername()

	file, header, err := c.GetFile("file")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	filename := header.Filename
	fileId := util.RemoveExt(filename)

	fileBuffer := bytes.NewBuffer(nil)
	if _, err = io.Copy(fileBuffer, file); err != nil {
		c.ResponseError(err.Error())
		return
	}

	fileType := "unknown"
	contentType := header.Header.Get("Content-Type")
	fileType, _ = util.GetOwnerAndNameFromId(contentType)

	if fileType != "video" {
		c.ResponseError(fmt.Sprintf("contentType: %s is not video", contentType))
		return
	}

	videoId := video.UploadVideo(fileId, filename, fileBuffer)
	if videoId != "" {
		startCoverUrlJob(owner, fileId, videoId)

		video := &object.Video{
			Owner:       owner,
			Name:        fileId,
			CreatedTime: util.GetCurrentTime(),
			DisplayName: fileId,
			VideoId:     videoId,
			Labels:      []*object.Label{},
		}
		object.AddVideo(video)
		c.ResponseOk(fileId)
	} else {
		c.ResponseError("videoId is empty")
	}
}
