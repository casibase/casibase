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

package video

import (
	"bytes"
	"fmt"
	"time"

	"github.com/alibabacloud-go/tea/tea"
	vod20170321 "github.com/alibabacloud-go/vod-20170321/v2/client"
	"github.com/casibase/casibase/util"
)

func GetVideoPlayAuth(videoId string) (string, error) {
	request := &vod20170321.GetVideoPlayAuthRequest{
		VideoId: tea.String(videoId),
	}

	resp, err := VodClient.GetVideoPlayAuth(request)
	if err != nil {
		return "", err
	}

	playAuth := tea.StringValue(resp.Body.PlayAuth)
	return playAuth, nil
}

type UploadAddress struct {
	Endpoint string `json:"Endpoint"`
	Bucket   string `json:"Bucket"`
	FileName string `json:"FileName"`
}

type UploadAuth struct {
	SecurityToken   string    `json:"SecurityToken"`
	AccessKeyId     string    `json:"AccessKeyId"`
	ExpireUTCTime   time.Time `json:"ExpireUTCTime"`
	AccessKeySecret string    `json:"AccessKeySecret"`
	Expiration      string    `json:"Expiration"`
	Region          string    `json:"Region"`
}

func UploadVideo(fileId string, filename string, fileBuffer *bytes.Buffer) (string, error) {
	// https://help.aliyun.com/document_detail/476208.html

	request := &vod20170321.CreateUploadVideoRequest{
		FileName: tea.String(filename),
		Title:    tea.String(fileId),
	}
	resp, err := VodClient.CreateUploadVideo(request)
	if err != nil {
		return "", nil
	}

	encodedUploadAddress := tea.StringValue(resp.Body.UploadAddress)
	videoId := tea.StringValue(resp.Body.VideoId)
	encodedUploadAuth := tea.StringValue(resp.Body.UploadAuth)

	uploadAddressStr := util.DecodeBase64(encodedUploadAddress)
	uploadAuthStr := util.DecodeBase64(encodedUploadAuth)

	uploadAddress := &UploadAddress{}
	err = util.JsonToStruct(uploadAddressStr, uploadAddress)
	if err != nil {
		return "", nil
	}

	uploadAuth := &UploadAuth{}
	err = util.JsonToStruct(uploadAuthStr, uploadAuth)
	if err != nil {
		return "", nil
	}

	ossClient, err := getOssClient(uploadAddress.Endpoint, uploadAuth.AccessKeyId, uploadAuth.AccessKeySecret, uploadAuth.SecurityToken)
	if err != nil {
		return "", nil
	}

	err = uploadLocalFile(ossClient, uploadAddress.Bucket, uploadAddress.FileName, fileBuffer)
	if err != nil {
		return "", nil
	}

	return videoId, nil
}

func GetVideoCoverUrl(videoId string) string {
	request := &vod20170321.GetVideoInfoRequest{
		VideoId: tea.String(videoId),
	}

	resp, err := VodClient.GetVideoInfo(request)
	if err != nil {
		fmt.Println(err)
		return err.Error()
	}

	return tea.StringValue(resp.Body.Video.CoverURL)
}

func GetVideoFileUrl(videoId string) string {
	request := &vod20170321.GetMezzanineInfoRequest{
		VideoId: tea.String(videoId),
	}

	resp, err := VodClient.GetMezzanineInfo(request)
	if err != nil {
		fmt.Println(err)
		return err.Error()
	}

	downloadUrl := tea.StringValue(resp.Body.Mezzanine.FileURL)
	if downloadUrl == "" {
		fmt.Println(err)
		return err.Error()
	}

	return downloadUrl
}
