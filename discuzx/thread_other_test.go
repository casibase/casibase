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
			// fmt.Printf("Failed to find thread: %d for post: %s\n", post.Tid, post.Message)
		}
	}

	// thread := threadMap[126152]
	thread := threadMap[126239]
	println(thread)

	getTopicAndReplies(thread, nil, nil)
}
