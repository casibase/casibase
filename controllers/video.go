// Copyright 2023 The casbin Authors. All Rights Reserved.
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

	"github.com/astaxie/beego"
	"github.com/casibase/casibase/audio"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/storage"
	"github.com/casibase/casibase/util"
	"github.com/casibase/casibase/video"
)

func (c *ApiController) GetGlobalVideos() {
	videos, err := object.GetGlobalVideos()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(videos)
}

func (c *ApiController) GetVideos() {
	owner := c.Input().Get("owner")

	videos, err := object.GetVideos(owner)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	for _, v := range videos {
		if len(v.Labels) != 0 {
			v.LabelCount = len(v.Labels)
			v.Labels = []*object.Label{}
		}

		if len(v.Segments) != 0 {
			v.SegmentCount = len(v.Segments)
			v.Segments = []*object.Label{}
		}
	}

	// for _, v := range videos {
	//	err = v.Populate()
	//	if err != nil {
	//		c.ResponseError(err.Error())
	//		return
	//	}
	// }

	c.ResponseOk(videos)
}

func (c *ApiController) GetVideo() {
	id := c.Input().Get("id")

	video, err := object.GetVideo(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	err = video.Populate()
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(video)
}

func (c *ApiController) UpdateVideo() {
	id := c.Input().Get("id")

	var video object.Video
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	success, err := object.UpdateVideo(id, &video)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(success)
}

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

func startCoverUrlJob(id string, videoId string) {
	go func(id string, videoId string) {
		for i := 0; i < 20; i++ {
			coverUrl := video.GetVideoCoverUrl(videoId)
			if coverUrl != "" {
				v, err := object.GetVideo(id)
				if err != nil {
					panic(err)
				}
				if v.CoverUrl != "" {
					break
				}

				v.CoverUrl = coverUrl
				_, err = object.UpdateVideo(id, v)
				if err != nil {
					panic(err)
				}

				break
			}

			time.Sleep(time.Second * 5)
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

	fileBuffer2 := copyBuffer(fileBuffer)

	fileType := "unknown"
	contentType := header.Header.Get("Content-Type")
	fileType, _ = util.GetOwnerAndNameFromId(contentType)
	if fileType != "video" {
		c.ResponseError(fmt.Sprintf("contentType: %s is not video", contentType))
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

	audioBuffer, err := audio.GetAudioFromVideo(fileBuffer2)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	audioStorageProviderName := beego.AppConfig.String("audioStorageProvider")
	audioStorageProvider, err := storage.NewCasdoorProvider(audioStorageProviderName)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	audioFilename := strings.Replace(filename, ".mp4", ".mp3", 1)
	audioUrl, err := audioStorageProvider.PutObject(userName, "Uploaded-Audio", audioFilename, audioBuffer)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	tmpInputFile, err := os.CreateTemp("", "casibase-audio-*.mp3")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	defer os.Remove(tmpInputFile.Name())

	_, err = io.Copy(tmpInputFile, audioBuffer)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}
	tmpInputFile.Close()

	segments := []*object.Label{}
	oSegments, err := audio.GetSegmentsFromAudio(tmpInputFile.Name())
	if err != nil {
		c.ResponseError(err.Error())
		return
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
		TagOnPause:  true,
		Keywords:    []string{},
	}
	_, err = object.AddVideo(v)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	id := util.GetIdFromOwnerAndName(userName, fileId)
	startCoverUrlJob(id, videoId)

	c.ResponseOk(fileId)
}
