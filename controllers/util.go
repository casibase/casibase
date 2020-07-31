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

package controllers

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/astaxie/beego"
	"golang.org/x/net/proxy"
)

var httpClient *http.Client

func InitHttpClient() {
	// https://stackoverflow.com/questions/33585587/creating-a-go-socks5-client
	proxyAddress := "127.0.0.1:10808"
	dialer, err := proxy.SOCKS5("tcp", proxyAddress, nil, proxy.Direct)
	if err != nil {
		panic(err)
	}

	tr := &http.Transport{Dial: dialer.Dial}
	httpClient = &http.Client{
		Transport: tr,
	}

	//resp, err2 := httpClient.Get("https://google.com")
	//if err2 != nil {
	//	panic(err2)
	//}
	//defer resp.Body.Close()
	//println("Response status: %s", resp.Status)
}

var ossURL, ossFilePath string
var ossClient *oss.Client
var ossBucket *oss.Bucket

func InitOSS() {
	OSSCustomDomain := beego.AppConfig.String("OSSCustomDomain")
	OSSBasicPath := beego.AppConfig.String("OSSBasicPath")
	//OSSRegion := beego.AppConfig.String("OSSRegion")
	OSSEndPoint := beego.AppConfig.String("OSSEndPoint")
	OSSBucket := beego.AppConfig.String("OSSBucket")

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

func UploadAvatarToOSS(avatar, memberId string) string {
	var avatarURL string
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	if len(avatar) == 0 {
		data := []byte(memberId)
		has := md5.Sum(data)
		memberMd5 := fmt.Sprintf("%x", has)
		avatar = "https://www.gravatar.com/avatar/" + memberMd5 + "?d=retro"
	}

	response, err := httpClient.Get(avatar)
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	contents, err := ioutil.ReadAll(response.Body)

	err = ossBucket.PutObject(ossFilePath+memberId+"/avatar/"+timestamp+".png", bytes.NewReader(contents))
	if err != nil {
		panic(err)
		return ""
	}

	avatarURL = ossURL + memberId + "/avatar/" + timestamp + ".png"

	return avatarURL
}
