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

var MaxTopTime = "9999-00-00T00:00:00+08:00"

func getTopicFromThread(thread *Thread, forum *Forum, classMap map[int]*Class) *object.Topic {
	content := ""
	ip := ""
	if thread.Posts[0].First == 1 {
		content = thread.Posts[0].Message
		ip = thread.Posts[0].Useip
	} else {
		panic("getTopicFromThread() error: thread.Posts[0].First != 1")
	}
	content = escapeContent(content)
	content = addAttachmentsToContent(content, thread.Posts[0].UploadFileRecords)

	tags := []string{}
	if class, ok := classMap[thread.Typeid]; ok {
		tags = append(tags, class.Name)
	}

	homePageTopTime := ""
	tabTopTime := ""
	nodeTopTime := ""
	deleted := false
	isHidden := false
	state := ""
	// https://blog.csdn.net/daily886/article/details/79569894
	if thread.Displayorder == 3 {
		homePageTopTime = MaxTopTime
	} else if thread.Displayorder == 2 {
		tabTopTime = MaxTopTime
	} else if thread.Displayorder == 1 {
		nodeTopTime = MaxTopTime
	} else if thread.Displayorder == -1 {
		deleted = true
	} else if thread.Displayorder == -2 {
		isHidden = true
		state = "Reviewing"
	} else if thread.Displayorder == -3 {
		isHidden = true
		state = "ReviewIgnored"
	} else if thread.Displayorder == -4 {
		isHidden = true
		state = "Draft"
	}

	nodeId := strconv.Itoa(thread.Fid)
	tabId := ""
	if forum != nil {
		nodeId = forum.Name

		if forum.Type == "group" || forum.Parent == nil {
			return nil
		}

		parentForum := forum.Parent
		if parentForum.Parent != nil {
			parentForum = parentForum.Parent
		}
		tabId = parentForum.Name
	} else {
		isHidden = true
	}

	topic := &object.Topic{
		Id:              thread.Tid,
		Author:          thread.Author,
		NodeId:          nodeId,
		NodeName:        nodeId,
		TabId:           tabId,
		Title:           thread.Subject,
		CreatedTime:     getTimeFromUnixSeconds(thread.Dateline),
		Tags:            tags,
		LastReplyUser:   thread.Lastposter,
		LastReplyTime:   getTimeFromUnixSeconds(thread.Lastpost),
		ReplyCount:      thread.Replies,
		UpCount:         thread.RecommendAdd,
		DownCount:       thread.RecommendSub,
		HitCount:        thread.Views,
		Hot:             thread.Heats,
		FavoriteCount:   thread.Favtimes,
		HomePageTopTime: homePageTopTime,
		TabTopTime:      tabTopTime,
		NodeTopTime:     nodeTopTime,
		Deleted:         deleted,
		Content:         content,
		IsHidden:        isHidden,
		Ip:              ip,
		State:           state,
	}
	return topic
}

func getReplyFromPost(topicId int, post *Post) *object.Reply {
	content := escapeContent(post.Message)
	content = addAttachmentsToContent(content, post.UploadFileRecords)

	deleted := false
	isHidden := false
	state := ""
	// https://blog.csdn.net/fengda2870/article/details/8699229
	if post.Invisible == -2 {
		isHidden = true
		state = "Reviewing"
	} else if post.Invisible == -3 {
		isHidden = true
		state = "ReviewIgnored"
	} else if post.Invisible == -5 {
		deleted = true
	}

	reply := &object.Reply{
		Id:          post.Pid,
		Author:      post.Author,
		TopicId:     topicId,
		CreatedTime: getTimeFromUnixSeconds(post.Dateline),
		Deleted:     deleted,
		IsHidden:    isHidden,
		ThanksNum:   0,
		Content:     content,
		Ip:          post.Useip,
		State:       state,
	}
	return reply
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

func getTopicAndReplies(thread *Thread, forum *Forum, classMap map[int]*Class) (*object.Topic, []*object.Reply) {
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
		return nil, nil
	}

	topic := getTopicFromThread(thread, forum, classMap)
	if topic == nil {
		// thread doesn't belong to any forum, ignore it
		return nil, nil
	}

	replies := []*object.Reply{}
	for i, post := range thread.Posts {
		if i == 0 {
			continue
		}

		//if post.First == 1 {
		//	panic(fmt.Errorf("getTopicAndReplies() error: thread.Posts[%d].First == 1", i))
		//}

		reply := getReplyFromPost(thread.Tid, post)
		replies = append(replies, reply)
	}

	return topic, replies
}
