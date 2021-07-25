// Copyright 2021 The casbin Authors. All Rights Reserved.
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

package service

import (
	"bytes"
	"fmt"
	"strconv"
	"time"

	awss3 "github.com/aws/aws-sdk-go/service/s3"
	beego "github.com/beego/beego/v2/adapter"
	"github.com/qor/oss"
	"github.com/qor/oss/aliyun"
	"github.com/qor/oss/s3"
)

var ossURL, basicPath string
var storage oss.StorageInterface

func InitOSS() {
	OSSProvider := beego.AppConfig.String("OSSProvider")
	if OSSProvider == "" {
		storage = nil
		return
	}
	switch OSSProvider {
	case "Aliyun":
		AliyunInit()
		break
	case "Awss3":
		Awss3Init()
		break
	}
	if storage == nil {
		fmt.Println("OSS config error")
		return
	}
	OSSBasicPath := beego.AppConfig.String("OSSBasicPath")
	OSSCustomDomain := beego.AppConfig.String("OSSCustomDomain")
	if OSSBasicPath == "" {
		OSSBasicPath = "casnode"
	}
	if OSSCustomDomain == "" {
		OSSCustomDomain = storage.GetEndpoint()
	}
	ossURL = "https://" + OSSCustomDomain + "/" + OSSBasicPath
	basicPath = "/" + OSSBasicPath
}

func AliyunInit() {
	accessKeyID := beego.AppConfig.String("accessKeyID")
	accessKeySecret := beego.AppConfig.String("accessKeySecret")
	ossBucket := beego.AppConfig.String("OSSBucket")
	ossEndPoint := beego.AppConfig.String("OSSEndPoint")
	if accessKeyID == "" || accessKeySecret == "" || ossBucket == "" || ossEndPoint == "" {
		fmt.Println("OSS config error")
		return
	}
	storage = aliyun.New(&aliyun.Config{
		AccessID:  accessKeyID,
		AccessKey: accessKeySecret,
		Bucket:    ossBucket,
		Endpoint:  ossEndPoint,
	})
}

func Awss3Init() {
	accessKeyID := beego.AppConfig.String("accessKeyID")
	accessKeySecret := beego.AppConfig.String("accessKeySecret")
	ossBucket := beego.AppConfig.String("OSSBucket")
	ossEndPoint := beego.AppConfig.String("OSSEndPoint")
	ossRegion := beego.AppConfig.String("OSSRegion")
	if accessKeyID == "" || accessKeySecret == "" || ossBucket == "" || ossEndPoint == "" || ossRegion == "" {
		fmt.Println("OSS config error")
		return
	}
	storage = s3.New(&s3.Config{
		AccessID:  accessKeyID,
		AccessKey: accessKeySecret,
		Region:    ossRegion,
		Bucket:    ossBucket,
		Endpoint:  ossEndPoint,
		ACL:       awss3.BucketCannedACLPublicRead,
	})
}

// UploadAvatarToOSS uploads an avatar to oss.
func UploadAvatarToOSS(avatar []byte, memberId string) string {
	if storage == nil {
		fmt.Println("OSS config error")
		return "oss conf error"
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	_, err := storage.Put(basicPath + "/" + memberId + "/avatar/" + timestamp + ".png", bytes.NewReader(avatar))
	if err != nil {
		panic(err)
	}
	return ossURL + "/" + memberId + "/avatar/" + timestamp + ".png"
}

// UploadFileToOSS uploads a file to the path, returns public URL
func UploadFileToOSS(file []byte, path string) string {
	if storage == nil {
		fmt.Println("OSS config error")
		return "oss conf error"
	}
	_, err := storage.Put(basicPath + path, bytes.NewReader(file))
	if err != nil {
		panic(err)
		return "OSS error"
	}
	return ossURL + path
}

// DeleteOSSFile deletes file according to the file path.
func DeleteOSSFile(filePath string) bool {
	if storage == nil {
		fmt.Println("OSS config error")
		return false
	}
	err := storage.Delete(filePath)
	if err != nil {
		panic(err)
		return false
	}
	return true
}
