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

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
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

//func getAttachments() []*Attachment {
//	attachments := []*Attachment{}
//	err := adapter.Engine.Table("forum_attachment").Find(&attachments)
//	if err != nil {
//		panic(err)
//	}
//
//	return attachments
//}

func getAttachmentsForThreadInTable(tableIndex int, threadId int) []*Attachment {
	attachments := []*Attachment{}
	tableName := fmt.Sprintf("forum_attachment_%d", tableIndex)
	err := adapter.Engine.Table(tableName).Where("tid = ?", threadId).Find(&attachments)
	if err != nil {
		panic(err)
	}

	return attachments
}

func getAttachmentsForThread(threadId int) []*Attachment {
	attachments := []*Attachment{}
	for i := 0; i < 10; i++ {
		tmp := getAttachmentsForThreadInTable(i, threadId)
		attachments = append(attachments, tmp...)
	}
	return attachments
}

func uploadAttachmentAndUpdatePost(cdnDomain string, attachment *Attachment, postMap map[int]*Post) {
	post := postMap[attachment.Pid]

	fileType := "file"
	if attachment.Isimage == 1 {
		fileType = "image"
	}
	filePath := fmt.Sprintf("usercontent/%s/%s/%s", post.Author, fileType, attachment.Filename)

	record := object.UploadFileRecord{
		FileName:    attachment.Filename,
		FilePath:    filePath,
		FileUrl:     cdnDomain + filePath,
		FileType:    fileType,
		FileExt:     util.FileExt(attachment.Filename),
		MemberId:    post.Author,
		CreatedTime: getTimeFromUnixSeconds(attachment.Dateline),
		Size:        attachment.Filesize,
		Views:       0,
		Desc:        attachment.Description,
		Deleted:     false,
	}

	affected, _ := object.AddFileRecord(&record)
	if affected {
		// upload to OSS
		copyFile(attachment.Attachment, filePath)
	}

	if post.UploadFileRecords == nil {
		post.UploadFileRecords = []*object.UploadFileRecord{}
	}
	post.UploadFileRecords = append(post.UploadFileRecords, &record)
}
