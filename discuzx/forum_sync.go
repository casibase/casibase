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
	"strings"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

func getInfoFromField(field *Field) (string, string, []string) {
	if field == nil {
		return "", "", []string{}
	}

	desc := field.Description
	extra := field.Rules

	moderators := []string{}
	if field.Moderators != "" {
		moderators = strings.Split(field.Moderators, "\t")
	}

	return desc, extra, moderators
}

func addForums() {
	tabs := []*object.Tab{}
	nodes := []*object.Node{}

	forumTree, _ := getForumTree()
	forumFieldMap := getFieldMap()
	for i, groupForum := range forumTree {
		defaultNode := ""
		if len(groupForum.Forums) != 0 {
			defaultNode = groupForum.Forums[0].Name
		}

		field := forumFieldMap[groupForum.Fid]
		desc, extra, moderators := getInfoFromField(field)

		tab := &object.Tab{
			Id:          groupForum.Name,
			Name:        groupForum.Name,
			Sorter:      groupForum.Displayorder,
			Ranking:     groupForum.Fid,
			CreatedTime: util.GetCurrentTime(),
			DefaultNode: defaultNode,
			HomePage:    true,
			Desc:        desc,
			Extra:       extra,
			Moderators:  moderators,
		}

		tabs = append(tabs, tab)
		fmt.Printf("[%d/%d]: Synced group forum: %s\n", i+1, len(forumTree), groupForum.Name)

		for j, forum := range groupForum.Forums {
			field2 := forumFieldMap[forum.Fid]
			desc2, extra2, moderators2 := getInfoFromField(field2)

			forumNode := &object.Node{
				Id:                forum.Name,
				Name:              forum.Name,
				CreatedTime:       util.GetCurrentTime(),
				Desc:              desc2,
				Extra:             extra2,
				Image:             "https://cdn.v2ex.com/navatar/3b8a/6142/215_xxlarge.png?m=1523190513",
				TabId:             groupForum.Name,
				ParentNode:        "",
				PlaneId:           "",
				Sorter:            forum.Displayorder,
				Ranking:           forum.Fid,
				Hot:               forum.Threads,
				Moderators:        moderators2,
				MailingList:       "",
				GoogleGroupCookie: "",
				IsHidden:          forum.Status == 0,
			}
			nodes = append(nodes, forumNode)
			fmt.Printf("\t[%d/%d]: Synced forum: %s\n", j+1, len(groupForum.Forums), forum.Name)

			for k, subForum := range forum.Forums {
				field3 := forumFieldMap[subForum.Fid]
				desc3, extra3, moderators3 := getInfoFromField(field3)

				subForumNode := &object.Node{
					Id:                subForum.Name,
					Name:              subForum.Name,
					CreatedTime:       util.GetCurrentTime(),
					Desc:              desc3,
					Extra:             extra3,
					Image:             "https://cdn.v2ex.com/navatar/3b8a/6142/215_xxlarge.png?m=1523190513",
					TabId:             groupForum.Name,
					ParentNode:        forum.Name,
					PlaneId:           "",
					Sorter:            subForum.Displayorder,
					Ranking:           subForum.Fid,
					Hot:               subForum.Threads,
					Moderators:        moderators3,
					MailingList:       "",
					GoogleGroupCookie: "",
					IsHidden:          subForum.Status == 0,
				}
				nodes = append(nodes, subForumNode)
				fmt.Printf("\t\t[%d/%d]: Synced sub forum: %s\n", k+1, len(forum.Forums), subForum.Name)
			}
		}
	}

	defaultNode := ""
	if len(nodes) > 0 {
		defaultNode = nodes[0].Id
	}

	tab := &object.Tab{
		Id:          "all",
		Name:        "全部",
		Sorter:      100,
		CreatedTime: util.GetCurrentTime(),
		DefaultNode: defaultNode,
		HomePage:    true,
	}
	tabs = append(tabs, tab)

	object.AddTabs(tabs)
	object.AddNodes(nodes)
}
