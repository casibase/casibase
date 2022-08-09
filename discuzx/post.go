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

import "github.com/casbin/casnode/object"

type Post struct {
	Pid       int
	Tid       int
	First     int
	Author    string
	Subject   string
	Dateline  int
	Message   string
	Useip     string
	Invisible int

	UploadFileRecords []*object.UploadFileRecord `xorm:"-"`
}

func getPosts() []*Post {
	posts := []*Post{}
	err := adapter.Engine.Table("pre_forum_post").Find(&posts)
	// err := adapter.Engine.Table("pre_forum_post").Where("tid = ?", threadId).Find(&posts)
	if err != nil {
		panic(err)
	}

	return posts
}

func getThreadPostsMap() (map[int][]*Post, int) {
	threadPostsMap := map[int][]*Post{}

	posts := getPosts()
	for _, post := range posts {
		tid := post.Tid
		if _, ok := threadPostsMap[tid]; !ok {
			threadPostsMap[tid] = []*Post{}
		}
		threadPostsMap[tid] = append(threadPostsMap[tid], post)
	}

	return threadPostsMap, len(posts)
}

func getPostMapFromPosts(posts []*Post) map[int]*Post {
	res := map[int]*Post{}
	for _, post := range posts {
		res[post.Pid] = post
	}
	return res
}
