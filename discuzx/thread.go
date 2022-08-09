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
	"sync"

	"github.com/casbin/casnode/object"
)

type Thread struct {
	Tid          int
	Fid          int
	Typeid       int
	Author       string
	Subject      string
	Dateline     int
	Lastpost     int
	Lastposter   string
	Views        int
	Replies      int
	Displayorder int
	RecommendAdd int
	RecommendSub int
	Heats        int
	Favtimes     int

	Posts []*Post `xorm:"-"`
}

func getThreads() []*Thread {
	threads := []*Thread{}
	err := adapter.Engine.Table("pre_forum_thread").Find(&threads)
	if err != nil {
		panic(err)
	}

	return threads
}

func getThread(id int) *Thread {
	thread := Thread{Tid: id}
	existed, err := adapter.Engine.Table("pre_forum_thread").Get(&thread)
	if err != nil {
		panic(err)
	}

	if existed {
		return &thread
	} else {
		return nil
	}
}

func getThreadMap() map[int]*Thread {
	threads := getThreads()

	m := map[int]*Thread{}
	for _, thread := range threads {
		m[thread.Tid] = thread
	}
	return m
}

func addThread(thread *Thread, threadPostsMap map[int][]*Post, attachments []*Attachment, forum *Forum, classMap map[int]*Class) (*object.Topic, []*object.Reply) {
	posts := threadPostsMap[thread.Tid]
	postMap := getPostMapFromPosts(posts)

	thread.Posts = posts

	// deleteWholeTopic(thread)

	mutex := sync.RWMutex{}

	var wg sync.WaitGroup
	wg.Add(len(attachments))
	for _, attachment := range attachments {
		go func(attachment *Attachment) {
			defer wg.Done()

			post := postMap[attachment.Pid]
			if post != nil {
				record := getRecordFromAttachment(attachment, post)
				if record != nil {
					mutex.Lock()
					if post.UploadFileRecords == nil {
						post.UploadFileRecords = []*object.UploadFileRecord{}
					}
					post.UploadFileRecords = append(post.UploadFileRecords, record)
					mutex.Unlock()
				}

			}
		}(attachment)
	}
	wg.Wait()

	topic, replies := getTopicAndReplies(thread, forum, classMap)
	return topic, replies
}
