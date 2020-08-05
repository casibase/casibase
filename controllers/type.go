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

type userInfoFromGoogle struct {
	Picture string `json:"picture"`
	Email   string `json:"email"`
}

type userEmailFromGithub struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

type userInfoFromGithub struct {
	Login     string `json:"login"`
	AvatarUrl string `json:"avatar_url"`
}

type authResponse struct {
	IsAuthenticated bool   `json:"isAuthenticated"`
	IsSignedUp      bool   `json:"isSignedUp"`
	Email           string `json:"email"`
	Avatar          string `json:"avatar"`
	Addition        string `json:"addition"`
}

type stsTokenResponse struct {
	AccessKeyID     string `json:"accessKeyId"`
	AccessKeySecret string `json:"accessKeySecret"`
	StsToken        string `json:"stsToken"`
}

type newNotification struct {
	ObjectId         int    `json:"objectId"`
	NotificationType int    `json:"notificationType"`
	ReceiverId       string `json:"receiverId"`
}

type updatePlaneInfo struct {
	Id    string `json:"id"`
	Field string `json:"field"`
	Value string `json:"value"`
}

type updateTopicNode struct {
	Id       int    `json:"id"`
	NodeId   string `json:"nodeId"`
	NodeName string `json:"nodeName"`
}

type editTopic struct {
	Id      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type editReply struct {
	Id      int    `json:"id"`
	Content string `json:"content"`
}

type getResetPasswordMember struct {
	Username  string `json:"username"`
	Captcha   string `json:"captcha"`
	CaptchaId string `json:"captchaId"`
}

type resetPasswordPhoneResponse struct {
	Username       string `json:"username"`
	Phone          string `json:"phone"`
	ValidateCodeId string `json:"validateCodeId"`
}

type resetPasswordWithPhone struct {
	Method         string `json:"method"`
	Username       string `json:"username"`
	ValidateCode   string `json:"validateCode"`
	ValidateCodeId string `json:"validateCodeId"`
}

type verifyResetWithPhoneRes struct {
	Username  string `json:"username"`
	ResetId   int    `json:"resetId"`
	ResetCode string `json:"resetCode"`
}

type resetPasswordWithEmail struct {
	Method   string `json:"method"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Url      string `json:"url"`
}

type resetPasswordVerify struct {
	Method   string `json:"method"`
	Username string `json:"username"`
	Id       string `json:"id"`
	Code     string `json:"code"`
	Password string `json:"password"`
}
