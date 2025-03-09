// Copyright 2023 The Casibase Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/beego/beego"
	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/audio"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/video"
)

// GetGlobalVideos
// @Title GetGlobalVideos
// @Tag Video API
// @Description get global videos
// @Success 200 {array} object.Video The Response object
// @router /get-global-videos [get]
func (c *ApiController) GetGlobalVideos() {
	videos, err := object.GetGlobalVideos()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(videos)
}

// GetVideos
// @Title GetVideos
// @Tag Video API
// @Description get videos
// @Param owner query string true "The owner of videos"
// @Success 200 {array} object.Video The Response object
// @router /get-videos [get]
func (c *ApiController) GetVideos() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")

	owner = ""

	if limit == "" || page == "" {
		videos, err := object.GetVideos(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(videos)
	} else {
		limit := util.ParseInt(limit)
		count, err := object.GetVideoCount(owner, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		videos, err := object.GetPaginationVideos(owner, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(videos, paginator.Nums())
	}
}

// GetVideo
// @Title GetVideo
// @Tag Video API
// @Description get video
// @Param id query string true "The id of video"
// @Success 200 {object} object.Video The Response object
// @router /get-video [get]
func (c *ApiController) GetVideo() {
	id := c.Input().Get("id")

	video, err := object.GetVideo(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if video != nil {
		err = video.Populate()
		if err != nil {
			c.ResponseError(err.Error())
			return
		}
	}

	c.ResponseOk(video)
}

// UpdateVideo
// @Title UpdateVideo
// @Tag Video API
// @Description update video
// @Param id query string true "The id (owner/name) of the video"
// @Param body body object.Video true "The details of the video"
// @Success 200 {object} controllers.Response The Response object
// @router /update-video [post]
func (c *ApiController) UpdateVideo() {
	user, ok := c.RequireSignedInUser()
	if !ok {
		return
	}

	id := c.Input().Get("id")

	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	if user.Type == "video-normal-user" {
		if len(video.Remarks) > 0 || len(video.Remarks2) > 0 || video.State != "Draft" {
			c.ResponseError("The video can only be updated when there are no remarks and the state is \"Draft\"")
			return
		}
	}

	success, err := object.UpdateVideo(id, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// AddVideo
// @Title AddVideo
// @Tag Video API
// @Description add video
// @Param body body object.Video true "The details of the video"
// @Success 200 {object} controllers.Response The Response object
// @router /add-video [post]
func (c *ApiController) AddVideo() {
	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.AddVideo(&video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

// DeleteVideo
// @Title DeleteVideo
// @Tag Video API
// @Description delete video
// @Param body body object.Video true "The details of the video"
// @Success 200 {object} controllers.Response The Response object
// @router /delete-video [post]
func (c *ApiController) DeleteVideo() {
	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.DeleteVideo(&video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

func updateVideoCoverUrl(id string, videoId string) error {
	for i := 0; i < 30; i++ {
		coverUrl := video.GetVideoCoverUrl(videoId)
		if coverUrl != "" {
			v, err := object.GetVideo(id)
			if err != nil {
				return err
			}
			if v.CoverUrl != "" {
				break
			}

			v.CoverUrl = coverUrl
			_, err = object.UpdateVideo(id, v)
			if err != nil {
				return err
			}

			break
		}

		time.Sleep(time.Second * 2)
	}

	return nil
}

func startCoverUrlJob(id string, videoId string) {
	err := object.SetDefaultVodClient()
	if err != nil {
		panic(err)
	}

	go func(id string, videoId string) {
		err = updateVideoCoverUrl(id, videoId)
		if err != nil {
			panic(err)
		}
	}(id, videoId)
}

func copyBuffer(original *bytes.Buffer) *bytes.Buffer {
	bufCopy := make([]byte, original.Len())
	copy(bufCopy, original.Bytes())
	return bytes.NewBuffer(bufCopy)
}

func getSpeaker(s string) string {
	if s == "0" {
		return "Teacher"
	} else if s == "1" {
		return "Student"
	} else {
		return fmt.Sprintf("Student %s", s)
	}
}

func getAudioSegments(userName string, filename string, fileBuffer *bytes.Buffer) (string, []*object.Label, error) {
	audioStorageProviderName := beego.AppConfig.String("audioStorageProvider")
	if audioStorageProviderName == "" {
		return "", []*object.Label{}, nil
	}

	fileBuffer2 := copyBuffer(fileBuffer)

	audioBuffer, err := audio.GetAudioFromVideo(fileBuffer2)
	if err != nil {
		return "", nil, err
	}

	audioStorageProvider, err := storage.NewCasdoorProvider(audioStorageProviderName)
	if err != nil {
		return "", nil, err
	}

	audioFilename := strings.Replace(filename, ".mp4", ".mp3", 1)
	audioUrl, err := audioStorageProvider.PutObject(userName, "Uploaded-Audio", audioFilename, audioBuffer)
	if err != nil {
		return "", nil, err
	}

	tmpInputFile, err := os.CreateTemp("", "casibase-audio-*.mp3")
	if err != nil {
		return "", nil, err
	}
	defer os.Remove(tmpInputFile.Name())

	_, err = io.Copy(tmpInputFile, audioBuffer)
	if err != nil {
		return "", nil, err
	}
	tmpInputFile.Close()

	segments := []*object.Label{}
	oSegments, err := audio.GetSegmentsFromAudio(tmpInputFile.Name())
	if err != nil {
		return "", nil, err
	}

	for i, item := range oSegments {
		segment := &object.Label{
			Id:        strconv.Itoa(i),
			StartTime: util.ParseFloat(item.Bg) / 1000,
			EndTime:   util.ParseFloat(item.Ed) / 1000,
			Text:      item.Onebest,
			Speaker:   getSpeaker(item.Speaker),
		}
		segments = append(segments, segment)
	}

	return audioUrl, segments, nil
}

// UploadVideo
// @Title UploadVideo
// @Tag Video API
// @Description upload video
// @Param file formData file true "The video file to upload"
// @Success 200 {object} string "The fileId of the uploaded video"
// @router /upload-video [post]
func (c *ApiController) UploadVideo() {
	userName, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	file, header, err := c.GetFile("file")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	defer file.Close()

	filename := header.Filename
	fileId := util.RemoveExt(filename)
	ext := filepath.Ext(filename)

	fileBuffer := bytes.NewBuffer(nil)
	_, err = io.Copy(fileBuffer, file)
	if err != nil {
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

	err = object.SetDefaultVodClient()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	videoId, err := video.UploadVideo(fileId, filename, fileBuffer)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	if videoId == "" {
		c.ResponseError("UploadVideo() error, videoId should not be empty")
		return
	}

	audioUrl, segments, err := getAudioSegments(userName, filename, fileBuffer)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	v := &object.Video{
		Owner:       userName,
		Name:        fileId,
		CreatedTime: util.GetCurrentTime(),
		DisplayName: fileId,
		Tag:         "",
		Type:        ext,
		VideoId:     videoId,
		CoverUrl:    "",
		AudioUrl:    audioUrl,
		Labels:      []*object.Label{},
		Segments:    segments,
		DataUrls:    []string{},
		DataUrl:     "",
		TagOnPause:  false,
		Remarks:     []*object.Remark{},
		Remarks2:    []*object.Remark{},
		State:       "Draft",
		Keywords:    []string{},
	}
	_, err = object.AddVideo(v)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	id := util.GetIdFromOwnerAndName(userName, fileId)

	err = updateVideoCoverUrl(id, videoId)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	// startCoverUrlJob(id, videoId)

	c.ResponseOk(fileId)
}
