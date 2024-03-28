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

// GetGlobalVideos
// @Title Get Global Videos
// @Tag Video API
// @Description Retrieves all videos from the database.
// @Success 200 {array} []*Video "An array of video objects."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database."
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
// @Title Get Videos
// @Tag Video API
// @Description Retrieves videos belonging to a specific owner from the database, with optional processing of label and segment counts.
// @Param owner query string true "The owner of the videos to retrieve."
// @Success 200 {array} []*Video "An array of video objects owned by the specified owner."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the owner is invalid."
// @router /get-videos [get]
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

// GetVideo
// @Title Get Video
// @Tag Video API
// @Description Retrieves a specific video from the database based on its ID.
// @Param id query string true "The ID of the video to retrieve."
// @Success 200 {*Video} Video "The video object if found."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue accessing the database or the provided ID is invalid."
// @router /get-video [get]
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

// UpdateVideo
// @Title Update Video
// @Tag Video API
// @Description Updates a video in the database based on the provided ID and data.
// @Param id query string true "The ID used to identify the video to update."
// @Param video body Video true "The updated video data."
// @Success 200 {boolean} bool "True if the video was successfully updated, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body, accessing the database, or the provided ID is invalid."
// @router /update-video [put]
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

// AddVideo
// @Title Add Video
// @Tag Video API
// @Description Adds a new video to the database.
// @Param video body Video true "The video data to be added."
// @Success 200 {boolean} bool "True if the video was successfully added, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
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
// @Title Delete Video
// @Tag Video API
// @Description Deletes a video from the database.
// @Param video body Video true "The video data to be deleted."
// @Success 200 {boolean} bool "True if the video was successfully deleted, false otherwise."
// @Failure 400 {string} string "The error message in case of failure, including if there's an issue with the request body or accessing the database."
// @router /delete-video [delete]
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

// startCoverUrlJob
// @Title Start Cover URL Job
// @Description Starts a background job to retrieve the cover URL for a video asynchronously.
// @Param id query string true "The ID of the video."
// @Param videoId query string true "The ID of the video in the external video service."
// @router /start-cover-url-job [post]
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

// getSpeaker
// @Title Get Speaker
// @Description Retrieves the speaker based on the provided identifier.
// @Param s query string true "The identifier of the speaker."
// @Success 200 {string} string "The speaker's role."
// @router /get-speaker [get]
func getSpeaker(s string) string {
	if s == "0" {
		return "Teacher"
	} else if s == "1" {
		return "Student"
	} else {
		return fmt.Sprintf("Student %s", s)
	}
}

// UploadVideo
// @Title Upload Video
// @Tag Video API
// @Description Uploads a video file, extracts audio, and processes it to create segments. Then, it uploads the video and audio files to storage and adds the video data to the database.
// @Param file formData file true "The video file to upload."
// @Success 200 {string} string "The ID of the uploaded video."
// @Failure 400 {string} string "The error message in case of failure, including issues with file upload, audio extraction, storage, or database operations."
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
