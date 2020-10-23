// Copyright 2020 The casbin Authors. All Rights Reserved.
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
	"strconv"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/astaxie/beego"
)

var ossURL, ossFilePath string
var ossClient *oss.Client
var ossBucket *oss.Bucket

// InitAliOSS initializes ali-oss client.
func InitAliOSS() {
	OSSCustomDomain := beego.AppConfig.String("OSSCustomDomain")
	OSSBasicPath := beego.AppConfig.String("OSSBasicPath")
	//OSSRegion := beego.AppConfig.String("OSSRegion")
	OSSEndPoint := beego.AppConfig.String("OSSEndPoint")
	OSSBucket := beego.AppConfig.String("OSSBucket")

	if OSSBucket == "" {
		return
	}

	if len(OSSCustomDomain) != 0 {
		ossURL = "https://" + OSSCustomDomain + "/" + OSSBasicPath + "/"
	} else {
		ossURL = "https://" + OSSBucket + "." + OSSEndPoint + "/" + OSSBasicPath + "/"
	}
	ossFilePath = OSSBasicPath + "/"
	var err error
	ossClient, err = oss.New(OSSEndPoint, accessKeyID, accessKeySecret)
	if err != nil {
		panic(err)
	}

	ossBucket, err = ossClient.Bucket(OSSBucket)
	if err != nil {
		panic(err)
	}
}

// UploadAvatarToAliOSS uploads an avatar to ali-oss.
func UploadAvatarToAliOSS(avatar []byte, memberId string) string {
	if ossClient == nil || ossBucket == nil {
		return ""
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	err := ossBucket.PutObject(ossFilePath+memberId+"/avatar/"+timestamp+".png", bytes.NewReader(avatar))
	if err != nil {
		panic(err)
		return ""
	}

	avatarURL := ossURL + memberId + "/avatar/" + timestamp + ".png"

	return avatarURL
}

// DeleteOSSFile deletes file according to the file path.
func DeleteOSSFile(filePath string) bool {
	err := ossBucket.DeleteObject(filePath)
	if err != nil {
		panic(err)
		return false
	}

	return true
}
