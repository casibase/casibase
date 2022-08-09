// Copyright 2020 The casbin Authors. All Rights Reserved.
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

package object

type Tab struct {
	Id          string   `xorm:"varchar(100) notnull pk" json:"id"`
	Name        string   `xorm:"varchar(100)" json:"name"`
	Sorter      int      `json:"sorter"`
	Ranking     int      `json:"ranking"`
	CreatedTime string   `xorm:"varchar(40)" json:"-"`
	DefaultNode string   `xorm:"varchar(100)" json:"defaultNode"`
	HomePage    bool     `xorm:"bool" json:"-"`
	Desc        string   `xorm:"mediumtext" json:"desc"`
	Extra       string   `xorm:"mediumtext" json:"extra"`
	Moderators  []string `xorm:"varchar(200)" json:"moderators"`
}

func GetTab(id string) *Tab {
	tab := Tab{Id: id}
	existed, err := adapter.Engine.Get(&tab)
	if err != nil {
		panic(err)
	}

	if existed {
		return &tab
	} else {
		return nil
	}
}

func AddTab(tab *Tab) bool {
	affected, err := adapter.Engine.Insert(tab)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func AddTabs(tabs []*Tab) bool {
	affected, err := adapter.Engine.Insert(tabs)
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func UpdateTab(id string, tab *Tab) bool {
	if GetTab(id) == nil {
		return false
	}

	_, err := adapter.Engine.Id(id).AllCols().Omit("id").Update(tab)
	if err != nil {
		panic(err)
	}

	// return affected != 0
	return true
}

func DeleteTab(id string) bool {
	affected, err := adapter.Engine.Id(id).Delete(&Tab{})
	if err != nil {
		panic(err)
	}

	return affected != 0
}

func GetHomePageTabs() []*Tab {
	tabs := []*Tab{}
	err := adapter.Engine.Asc("sorter").Where("home_page = ?", 1).Find(&tabs)
	if err != nil {
		panic(err)
	}

	return tabs
}

func GetAllTabs() []*Tab {
	tabs := []*Tab{}
	err := adapter.Engine.Asc("sorter").Find(&tabs)
	if err != nil {
		panic(err)
	}

	return tabs
}

// GetTabAdmin returns more tab information for admin.
func GetTabAdmin(id string) *AdminTabInfo {
	tab := Tab{Id: id}
	existed, err := adapter.Engine.Get(&tab)
	if err != nil {
		panic(err)
	}

	if existed {
		var topicsNum int
		nodes := GetNodeFromTab(tab.Id)
		for _, v := range nodes {
			topicsNum += GetNodeTopicNum(v.Id)
		}
		res := AdminTabInfo{
			Id:          tab.Id,
			Name:        tab.Name,
			Sorter:      tab.Sorter,
			CreatedTime: tab.CreatedTime,
			DefaultNode: tab.DefaultNode,
			HomePage:    tab.HomePage,
			NodesNum:    len(nodes),
			TopicsNum:   topicsNum,
		}
		return &res
	} else {
		return nil
	}
}

func GetAllTabsAdmin() []*AdminTabInfo {
	tabs := []*Tab{}
	err := adapter.Engine.Asc("sorter").Find(&tabs)
	if err != nil {
		panic(err)
	}

	res := []*AdminTabInfo{}
	for _, v := range tabs {
		var topicsNum int
		nodes := GetNodeFromTab(v.Id)
		for _, v := range nodes {
			topicsNum += GetNodeTopicNum(v.Id)
		}
		temp := AdminTabInfo{
			Id:          v.Id,
			Name:        v.Name,
			Sorter:      v.Sorter,
			CreatedTime: v.CreatedTime,
			DefaultNode: v.DefaultNode,
			HomePage:    v.HomePage,
			NodesNum:    len(nodes),
			TopicsNum:   topicsNum,
		}
		res = append(res, &temp)
	}

	return res
}

func GetDefaultTab() string {
	var tab Tab
	_, err := adapter.Engine.Where("home_page = ?", 1).Asc("sorter").Limit(1).Get(&tab)
	if err != nil {
		panic(err)
	}

	return tab.Id
}

func GetNodesByTab(id string) []*Node {
	nodes := []*Node{}

	num := HomePageNodeNum

	if id == "all" {
		err := adapter.Engine.Cols("id, name").Desc("sorter").Limit(num).Find(&nodes)
		if err != nil {
			panic(err)
		}
	} else {
		err := adapter.Engine.Where("tab_id = ?", id).Cols("id, name").Desc("sorter").Limit(num).Find(&nodes)
		if err != nil {
			panic(err)
		}
	}

	return nodes
}
