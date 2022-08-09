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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
	"github.com/casbin/casnode/util"
)

type NewUploadFile struct {
	FileName string `json:"fileName"`
	FilePath string `json:"filePath"`
	FileUrl  string `json:"fileUrl"`
	Size     int    `json:"size"`
}

func (c *ApiController) GetFiles() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	limitStr := c.Input().Get("limit")
	pageStr := c.Input().Get("page")
	defaultLimit := object.DefaultFilePageNum

	var limit, offset int
	if len(limitStr) != 0 {
		limit = util.ParseInt(limitStr)
	} else {
		limit = defaultLimit
	}
	if len(pageStr) != 0 {
		page := util.ParseInt(pageStr)
		offset = page*limit - limit
	}
	files := object.GetFiles(GetUserName(user), limit, offset)
	fileNum := fileNumResp{Num: object.GetFilesNum(GetUserName(user)), MaxNum: object.GetMemberFileQuota(user)}

	c.ResponseOk(files, fileNum)
}

func (c *ApiController) GetFileNum() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	num := fileNumResp{Num: object.GetFilesNum(GetUserName(user)), MaxNum: object.GetMemberFileQuota(user)}
	resp := Response{Status: "ok", Msg: "success", Data: num}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) AddFileRecord() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	var file NewUploadFile
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &file)
	if err != nil {
		panic(err)
	}

	var resp Response
	uploadFileNum := object.GetFilesNum(GetUserName(user))
	if uploadFileNum >= object.GetMemberFileQuota(user) {
		resp = Response{Status: "fail", Msg: "You have exceeded the upload limit."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	record := object.UploadFileRecord{
		FileName:    file.FileName,
		FilePath:    file.FilePath,
		FileUrl:     file.FileUrl,
		FileType:    util.FileType(file.FileName),
		FileExt:     util.FileExt(file.FileName),
		MemberId:    GetUserName(user),
		CreatedTime: util.GetCurrentTime(),
		Size:        file.Size,
		Deleted:     false,
	}

	affected, id := object.AddFileRecord(&record)
	if affected {
		fileNum := fileNumResp{Num: object.GetFilesNum(GetUserName(user)), MaxNum: object.GetMemberFileQuota(user)}
		resp = Response{Status: "ok", Msg: "success", Data: id, Data2: fileNum}
	} else {
		resp = Response{Status: "fail", Msg: "Add file failed, please try again.", Data: id}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DeleteFile() {
	idStr := c.Input().Get("id")

	user := c.GetSessionUser()

	id := util.ParseInt(idStr)
	fileInfo := object.GetFile(id)
	if !object.FileEditable(user, fileInfo.MemberId) {
		c.ResponseError("Permission denied.")
		return
	}

	affected := object.DeleteFileRecord(id)
	var resp Response
	if affected {
		service.DeleteFileFromStorage(fileInfo.FilePath)
		fileNum := fileNumResp{Num: object.GetFilesNum(GetUserName(user)), MaxNum: object.GetMemberFileQuota(user)}
		resp = Response{Status: "ok", Msg: "success", Data: id, Data2: fileNum}
	} else {
		resp = Response{Status: "fail", Msg: "Delete file failed, please try again."}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetFile() {
	idStr := c.Input().Get("id")

	id := util.ParseInt(idStr)
	file := object.GetFile(id)
	var resp Response
	if file == nil || file.Deleted {
		resp = Response{Status: "error", Msg: "No such file."}
	} else {
		object.AddFileViewsNum(id) // together with add file views num
		resp = Response{Status: "ok", Msg: "success", Data: file}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateFileDescribe() {
	user := c.GetSessionUser()

	id := util.ParseInt(c.Input().Get("id"))

	var desc fileDescribe
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &desc)
	if err != nil {
		panic(err)
	}

	var resp Response
	file := object.GetFile(id)
	if !object.FileEditable(user, file.MemberId) {
		resp = Response{Status: "fail", Msg: "Permission denied."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	} else {
		res := object.UpdateFileDescribe(id, desc.FileName, desc.Desc)
		resp = Response{Status: "ok", Msg: "success", Data: res}
	}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title UploadFile
// @Tag File API
// @router /upload-file [post]
func (c *ApiController) UploadFile() {
	if c.RequireSignedIn() {
		return
	}

	memberId := c.GetSessionUsername()

	fileBase64 := c.Ctx.Request.Form.Get("file")
	fileType := c.Ctx.Request.Form.Get("type")
	fileName := c.Ctx.Request.Form.Get("name")
	index := strings.Index(fileBase64, ",")
	fileBytes, _ := base64.StdEncoding.DecodeString(fileBase64[index+1:])
	fileUrl, _ := service.UploadFileToStorage(memberId, "file", "UploadFile", fmt.Sprintf("casnode/file/%s/%s.%s", memberId, fileName, fileType), fileBytes)

	resp := Response{Status: "ok", Msg: fileName + "." + fileType, Data: fileUrl}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title ModeratorUpload
// @Tag File API
// @router /upload-moderator [post]
func (c *ApiController) ModeratorUpload() {
	if c.RequireSignedIn() {
		return
	}

	user := c.GetSessionUser()

	if !user.IsAdmin {
		c.ResponseError("You have no permission to upload files here. Need to be moderator.")
		return
	}

	fileBase64 := c.Ctx.Request.Form.Get("file")
	fileName := c.Ctx.Request.Form.Get("name")
	filePath := c.Ctx.Request.Form.Get("filepath")
	index := strings.Index(fileBase64, ",")
	fileBytes, _ := base64.StdEncoding.DecodeString(fileBase64[index+1:])
	fileUrl, _ := service.UploadFileToStorage(user.Name, "file", "ModeratorUpload", fmt.Sprintf("casnode/file/%s/%s/%s", user.Name, filePath, fileName), fileBytes)
	timeStamp := fmt.Sprintf("?time=%d", time.Now().UnixNano())

	c.ResponseOk(fileUrl + timeStamp)
	// resp := Response{Status: "ok", Msg: fileName, Data: fileUrl + timeStamp}
}
