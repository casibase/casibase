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
	"strconv"

	"github.com/casbin/casnode/object"
)

func addTopic(thread *Thread, forum *Forum, classMap map[int]*Class) int {
	content := ""
	if thread.Posts[0].First == 1 {
		content = thread.Posts[0].Message
	} else {
		panic("addTopic(): thread.Posts[0].First != 1")
	}
	content = escapeContent(content)
	content = addAttachmentsToContent(content, thread.Posts[0].UploadFileRecords)

	tags := []string{}
	if class, ok := classMap[thread.Typeid]; ok {
		tags = append(tags, class.Name)
	}

	nodeName := strconv.Itoa(thread.Fid)
	if forum != nil {
		nodeName = forum.Name
	}

	topic := object.Topic{
		Id:            thread.Tid,
		Author:        thread.Author,
		NodeId:        nodeName,
		NodeName:      nodeName,
		Title:         thread.Subject,
		CreatedTime:   getTimeFromUnixSeconds(thread.Dateline),
		Tags:          tags,
		LastReplyUser: thread.Lastposter,
		LastReplyTime: getTimeFromUnixSeconds(thread.Lastpost),
		ReplyCount:    thread.Replies,
		UpCount:       thread.RecommendAdd,
		HitCount:      thread.Views,
		Hot:           thread.Heats,
		FavoriteCount: thread.Favtimes,
		Deleted:       false,
		Content:       content,
		IsHidden:      false,
	}

	res, id := object.AddTopic(&topic)
	if !res {
		panic("addTopic(): not affected")
	}
	return id
}

func addReply(topicId int, post *Post) int {
	content := escapeContent(post.Message)
	content = addAttachmentsToContent(content, post.UploadFileRecords)

	reply := object.Reply{
		Id:          post.Pid,
		Author:      post.Author,
		TopicId:     topicId,
		CreatedTime: getTimeFromUnixSeconds(post.Dateline),
		Deleted:     false,
		ThanksNum:   0,
		Content:     content,
	}

	res, id := object.AddReply(&reply)
	if !res {
		panic("addReply(): not affected")
	}
	return id
}

func deleteWholeTopic(thread *Thread) {
	topics := object.GetTopicsByTitleAndAuthor(thread.Subject, thread.Author)
	for _, topic := range topics {
		topicId := topic.Id
		object.DeleteTopicHard(topicId)
		object.DeleteFilesByMember(thread.Author)

		//replies := object.GetReplies(topicId, "")
		//for _, reply := range replies {
		//	object.DeleteFilesByMember(reply.Author)
		//}
		object.DeleteRepliesHardByTopicId(topicId)
	}
}

func recordToHyperlink(record *object.UploadFileRecord) string {
	if record.FileType == "image" {
		return fmt.Sprintf("![%s](%s)\n", record.FileName, record.FileUrl)
	} else {
		return fmt.Sprintf("- [%s](%s)\n", record.FileName, record.FileUrl)
	}
}

func addAttachmentsToContent(content string, records []*object.UploadFileRecord) string {
	images := []*object.UploadFileRecord{}
	files := []*object.UploadFileRecord{}

	for _, record := range records {
		if record.FileType == "image" {
			images = append(images, record)
		} else {
			files = append(files, record)
		}
	}

	if len(images) != 0 {
		content += "\n\n### 图片：\n\n"
		for _, record := range images {
			content += recordToHyperlink(record)
		}
		return content
	}

	if len(files) != 0 {
		content += "\n\n### 附件：\n\n"
		for _, record := range files {
			content += recordToHyperlink(record)
		}
		return content
	}

	return content
}

func addWholeTopic(thread *Thread, forum *Forum, classMap map[int]*Class) {
	// remove leading useless posts
	posts := []*Post{}
	isBeforeFirstPosition := true
	for _, post := range thread.Posts {
		if !isBeforeFirstPosition || post.First == 1 {
			isBeforeFirstPosition = false
			posts = append(posts, post)
		}
	}
	thread.Posts = posts

	if len(thread.Posts) == 0 {
		// thread is deleted.
		return
	}

	topicId := addTopic(thread, forum, classMap)
	for i, post := range thread.Posts {
		if i == 0 {
			continue
		}

		if post.First == 1 {
			panic("addWholeTopic(): thread.Posts[0].First == 1")
		}

		addReply(topicId, post)
	}
}
