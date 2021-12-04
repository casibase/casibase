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

import "fmt"

type Forum struct {
	Fid          int
	Fup          int
	Type         string
	Name         string
	Status       int
	Displayorder int
	Threads      int

	Forums []*Forum `xorm:"-"`
	Parent *Forum   `xorm:"-"`
}

func getForums() []*Forum {
	forums := []*Forum{}
	err := adapter.Engine.Table("pre_forum_forum").Find(&forums)
	if err != nil {
		panic(err)
	}

	return forums
}

func getForum(id int) *Forum {
	forum := Forum{Fid: id}
	existed, err := adapter.Engine.Table("pre_forum_forum").Get(&forum)
	if err != nil {
		panic(err)
	}

	if existed {
		return &forum
	} else {
		return nil
	}
}

func getForumMap() map[int]*Forum {
	forums := getForums()

	m := map[int]*Forum{}
	for _, forum := range forums {
		m[forum.Fid] = forum
	}
	return m
}

func getForumTree() ([]*Forum, map[int]*Forum) {
	res := []*Forum{}

	forumMap := getForumMap()
	for _, forum := range forumMap {
		if forum.Type == "group" {
			res = append(res, forum)
		} else {
			parentForum := forumMap[forum.Fup]
			parentForum.Forums = append(parentForum.Forums, forum)
			forum.Parent = parentForum
		}
	}

	forumNameCountMap := map[string]int{}
	for _, forum := range forumMap {
		if forum.Type == "group" {
			forumNameCountMap[forum.Name] = 0
			continue
		}

		if v, ok := forumNameCountMap[forum.Name]; ok {
			forumNameCountMap[forum.Name] = v + 1
		} else {
			forumNameCountMap[forum.Name] = 1
		}
	}

	for _, forum := range forumMap {
		if forumNameCountMap[forum.Name] > 1 {
			parentForum := forumMap[forum.Fup]
			forum.Name = fmt.Sprintf("%s-%s", parentForum.Name, forum.Name)
		}
	}

	return res, forumMap
}
