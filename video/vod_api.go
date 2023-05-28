package video

import (
	"bytes"
	"fmt"
	"time"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/vod"
	"github.com/casbin/casbase/util"
)

func GetVideoPlayAuth(videoId string) string {
	r := vod.CreateGetVideoPlayAuthRequest()
	r.VideoId = videoId
	r.AcceptFormat = "JSON"

	resp, err := vodClient.GetVideoPlayAuth(r)
	if err != nil {
		fmt.Println(err)
		return err.Error()
	}

	playAuth := resp.PlayAuth
	return playAuth
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

func UploadVideo(fileId string, filename string, fileBuffer *bytes.Buffer) string {
	// https://help.aliyun.com/document_detail/476208.html

	r := vod.CreateCreateUploadVideoRequest()
	r.Scheme = "https"
	r.FileName = filename
	r.Title = fileId

	resp, err := vodClient.CreateUploadVideo(r)
	if err != nil {
		panic(err)
	}

	encodedUploadAddress := resp.UploadAddress
	videoId := resp.VideoId
	encodedUploadAuth := resp.UploadAuth

	uploadAddressStr := util.DecodeBase64(encodedUploadAddress)
	uploadAuthStr := util.DecodeBase64(encodedUploadAuth)

	uploadAddress := &UploadAddress{}
	err = util.JsonToStruct(uploadAddressStr, uploadAddress)
	if err != nil {
		panic(err)
	}

	uploadAuth := &UploadAuth{}
	err = util.JsonToStruct(uploadAuthStr, uploadAuth)
	if err != nil {
		panic(err)
	}

	ossClient := getOssClient(uploadAddress.Endpoint, uploadAuth.AccessKeyId, uploadAuth.AccessKeySecret, uploadAuth.SecurityToken)

	uploadLocalFile(ossClient, uploadAddress.Bucket, uploadAddress.FileName, fileBuffer)

	return videoId
}
