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
	"testing"

	"github.com/casbin/casnode/object"
)

func TestGetThreads(t *testing.T) {
	InitAdapter()
	object.InitAdapter()

	threadMap := getThreadMap()
	for _, thread := range threadMap {
		thread.Posts = []*Post{}
	}

	posts := getPosts()
	for _, post := range posts {
		if thread, ok := threadMap[post.Tid]; ok {
			thread.Posts = append(thread.Posts, post)
		} else {
			//fmt.Printf("Failed to find thread: %d for post: %s\n", post.Tid, post.Message)
		}
	}

	//thread := threadMap[126152]
	thread := threadMap[126239]
	println(thread)

	addWholeTopic(thread)
	//for _, thread := range threadMap {
	//	thread.
	//}
}

func syncThread(threadId int) {
	//threadId := 1
	//threadId := 459
	//threadId := 36643
	//threadId := 126239
	attachments := getAttachmentsForThread(threadId)
	thread := getThread(threadId)
	if thread == nil {
		return
	}

	posts := getPostsForThread(thread.Tid)
	thread.Posts = append(thread.Posts, posts...)
	postMap := getPostMapFromPosts(posts)

	deleteWholeTopic(thread)

	for _, attachment := range attachments {
		uploadAttachmentAndUpdatePost(cdnDomain, attachment, postMap)
	}
	addWholeTopic(thread)
}

func TestGetThread(t *testing.T) {
	InitAdapter()
	object.InitAdapter()

	//syncThread(114)

	threads := getThreads()
	for _, thread := range threads {
		if thread.Fid != 2 && thread.Fid != 100 && thread.Fid != 40 {
			continue
		}

		if thread.Tid <= 125956 {
			continue
		}

		syncThread(thread.Tid)
		fmt.Printf("Processed thread, tid = %d, fid = %d\n", thread.Tid, thread.Fid)
	}

	//for i := 0; i < 10; i ++ {
	//	syncThread(i)
	//}
}
