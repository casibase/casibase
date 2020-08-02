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
	"github.com/aliyun/alibaba-cloud-sdk-go/services/dysmsapi"
	"github.com/astaxie/beego"
)

var accessKeyID = beego.AppConfig.String("accessKeyID")
var accessKeySecret = beego.AppConfig.String("accessKeySecret")
var SMSSignName = beego.AppConfig.String("SMSSignName")
var SMSTemplateCode = beego.AppConfig.String("SMSTemplateCode")

func SendSms(phoneNumber, code string) {
	client, err := dysmsapi.NewClientWithAccessKey("cn-hangzhou", accessKeyID, accessKeySecret)

	request := dysmsapi.CreateSendSmsRequest()
	request.Scheme = "https"

	request.PhoneNumbers = phoneNumber
	request.SignName = ""
	request.TemplateCode = ""
	request.TemplateParam = "{\"code\":\"" + code + "\"}"

	_, err = client.SendSms(request)
	if err != nil {
		panic(err)
	}
}
