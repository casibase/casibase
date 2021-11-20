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
	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

func syncForums() {
	forums := getStructuredForums()
	for _, groupForum := range forums {
		tab := &object.Tab{
			Id:          groupForum.Name,
			Name:        groupForum.Name,
			Sorter:      groupForum.Displayorder,
			CreatedTime: util.GetCurrentTime(),
			DefaultNode: "",
			HomePage:    false,
		}
		object.AddTab(tab)

		for _, forum := range groupForum.Forums {
			forumNode := &object.Node{
				Id:                forum.Name,
				Name:              forum.Name,
				CreatedTime:       util.GetCurrentTime(),
				Desc:              forum.Name,
				Image:             "https://cdn.v2ex.com/navatar/3b8a/6142/215_xxlarge.png?m=1523190513",
				TabId:             groupForum.Name,
				ParentNode:        "",
				PlaneId:           "",
				Sorter:            forum.Displayorder,
				Hot:               forum.Threads,
				Moderators:        []string{},
				MailingList:       "",
				GoogleGroupCookie: "",
				IsHidden:          forum.Status == 0,
			}
			object.AddNode(forumNode)

			for _, subForum := range forum.Forums {
				subForumNode := &object.Node{
					Id:                subForum.Name,
					Name:              subForum.Name,
					CreatedTime:       util.GetCurrentTime(),
					Desc:              subForum.Name,
					Image:             "https://cdn.v2ex.com/navatar/3b8a/6142/215_xxlarge.png?m=1523190513",
					TabId:             groupForum.Name,
					ParentNode:        forum.Name,
					PlaneId:           "",
					Sorter:            subForum.Displayorder,
					Hot:               subForum.Threads,
					Moderators:        []string{},
					MailingList:       "",
					GoogleGroupCookie: "",
					IsHidden:          subForum.Status == 0,
				}
				object.AddNode(subForumNode)
			}
		}
	}
}
