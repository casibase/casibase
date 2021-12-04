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

package discuzx

import (
	"fmt"
	"net/url"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/service"
)

type Attachment struct {
	Tid         int
	Pid         int
	Uid         int
	Dateline    int
	Filename    string
	Filesize    int
	Attachment  string
	Description string
	Isimage     int
	Width       int
}

func getAttachmentsInTable(tableIndex int) []*Attachment {
	attachments := []*Attachment{}
	tableName := fmt.Sprintf("pre_forum_attachment_%d", tableIndex)
	err := adapter.Engine.Table(tableName).Find(&attachments)
	if err != nil {
		panic(err)
	}

	return attachments
}

func getAttachments() []*Attachment {
	attachments := []*Attachment{}
	for i := 0; i < 10; i++ {
		tmp := getAttachmentsInTable(i)
		attachments = append(attachments, tmp...)
	}
	return attachments
}

func getAttachmentMap() map[int][]*Attachment {
	attachments := getAttachments()
	m := map[int][]*Attachment{}

	for _, attachment := range attachments {
		if _, ok := m[attachment.Tid]; !ok {
			m[attachment.Tid] = []*Attachment{}
		}

		m[attachment.Tid] = append(m[attachment.Tid], attachment)
	}
	return m
}

func uploadDiscuzxFile(username string, fileBytes []byte, fileName string, createdTime string, description string) string {
	username = url.QueryEscape(username)
	memberId := fmt.Sprintf("%s/%s", CasdoorOrganization, username)
	fileUrl, _ := service.UploadFileToStorageSafe(memberId, "file", "uploadDiscuzxFile", fmt.Sprintf("file/%s/%s", memberId, fileName), fileBytes, createdTime, description)
	return fileUrl
}

func getRecordFromAttachment(attachment *Attachment, post *Post) *object.UploadFileRecord {
	oldFileUrl := fmt.Sprintf("%s%s", discuzxAttachmentBaseUrl, attachment.Attachment)
	fileBytes, _, err := downloadFileSafe(oldFileUrl)
	if err != nil {
		if urlError, ok := err.(*url.Error); ok {
			fmt.Printf("\t\t[%d]: getRecordFromAttachment() error: %s, the attachement is deleted: %s\n", post.Pid, urlError.Error(), attachment.Attachment)
			return nil
		} else {
			panic(err)
		}
	}

	fileUrl := uploadDiscuzxFile(post.Author, fileBytes, attachment.Filename, getTimeFromUnixSeconds(attachment.Dateline), attachment.Description)

	fileType := "file"
	if attachment.Isimage == 1 {
		fileType = "image"
	}

	record := &object.UploadFileRecord{
		FileName: attachment.Filename,
		FileUrl:  fileUrl,
		FileType: fileType,
	}
	return record
}
