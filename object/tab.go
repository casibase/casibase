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

import "github.com/astaxie/beego"

type Tab struct {
	Id          string `xorm:"varchar(100) notnull pk" json:"id"`
	Name        string `xorm:"varchar(100)" json:"name"`
	Sorter      int    `xorm:"int"`
	CreatedTime string `xorm:"varchar(100)"`
	DefaultNode string `xorm:"varchar(100)" json:"defaultNode"`
	HomePage    bool   `xorm:"bool"`
}

func GetTab(id string) *Tab {
	tab := Tab{Id: id}
	existed, err := adapter.engine.Get(&tab)
	if err != nil {
		panic(err)
	}

	if existed {
		return &tab
	} else {
		return nil
	}
}

func GetTabs() []*Tab {
	tabs := []*Tab{}
	err := adapter.engine.Asc("sorter").Where("home_page = ?", 1).Find(&tabs)
	if err != nil {
		panic(err)
	}

	return tabs
}

func GetDefaultTab() string {
	var tab Tab
	_, err := adapter.engine.Where("home_page = ?", 1).Asc("sorter").Limit(1).Get(&tab)
	if err != nil {
		panic(err)
	}

	return tab.Id
}

func GetNodesByTab(id string) []*Node {
	nodes := []*Node{}

	num, _ := beego.AppConfig.Int("homePageNodeNum")

	if id == "all" {
		err := adapter.engine.Cols("id, name").Limit(num).Find(&nodes)
		if err != nil {
			panic(err)
		}
	} else {
		err := adapter.engine.Where("tab_id = ?", id).Cols("id, name").Limit(num).Find(&nodes)
		if err != nil {
			panic(err)
		}
	}

	return nodes
}
