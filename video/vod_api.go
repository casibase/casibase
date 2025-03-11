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

	"github.com/aliyun/alibaba-cloud-sdk-go/services/vod"
	"github.com/casibase/casibase/util"
)

func GetVideoPlayAuth(videoId string) (string, error) {
	r := vod.CreateGetVideoPlayAuthRequest()
	r.VideoId = videoId
	r.AcceptFormat = "JSON"

	resp, err := VodClient.GetVideoPlayAuth(r)
	if err != nil {
		return "", err
	}

	playAuth := resp.PlayAuth
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

	r := vod.CreateCreateUploadVideoRequest()
	r.Scheme = "https"
	r.FileName = filename
	r.Title = fileId
	resp, err := VodClient.CreateUploadVideo(r)
	if err != nil {
		return "", nil
	}

	encodedUploadAddress := resp.UploadAddress
	videoId := resp.VideoId
	encodedUploadAuth := resp.UploadAuth

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
	r := vod.CreateGetVideoInfoRequest()
	r.VideoId = videoId
	r.AcceptFormat = "JSON"

	resp, err := VodClient.GetVideoInfo(r)
	if err != nil {
		fmt.Println(err)
		return err.Error()
	}

	return resp.Video.CoverURL
}
