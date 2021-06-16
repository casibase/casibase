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

package controllers

import (
	"encoding/json"

	"github.com/casbin/casnode/object"
	"github.com/casbin/casnode/util"
)

func (c *ApiController) GetTabs() {
	c.Data["json"] = object.GetHomePageTabs()
	c.ServeJSON()
}

func (c *ApiController) GetAllTabs() {
	c.Data["json"] = object.GetAllTabs()
	c.ServeJSON()
}

func (c *ApiController) GetAllTabsAdmin() {
	c.Data["json"] = object.GetAllTabsAdmin()
	c.ServeJSON()
}

func (c *ApiController) GetTabAdmin() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetTabAdmin(id)
	c.ServeJSON()
}

func (c *ApiController) AddTab() {
	var tabInfo object.AdminTabInfo
	var resp Response

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tabInfo)
	if err != nil {
		panic(err)
	}

	if tabInfo.Id == "" || tabInfo.Name == "" || tabInfo.Sorter <= 0 {
		resp = Response{Status: "fail", Msg: "Some information is missing"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	if object.HasTab(tabInfo.Id) {
		resp = Response{Status: "fail", Msg: "Tab ID existed"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	tab := object.Tab{
		Id:          tabInfo.Id,
		Name:        tabInfo.Name,
		Sorter:      tabInfo.Sorter,
		CreatedTime: util.GetCurrentTime(),
		DefaultNode: tabInfo.DefaultNode,
		HomePage:    tabInfo.HomePage,
	}

	res := object.AddTab(&tab)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) UpdateTab() {
	id := c.Input().Get("id")

	var resp Response
	var tabInfo object.AdminTabInfo

	if !object.CheckModIdentity(c.GetSessionUsername()) {
		resp = Response{Status: "fail", Msg: "Unauthorized."}
	}

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tabInfo)
	if err != nil {
		panic(err)
	}

	tab := object.Tab{
		//Id:          tabInfo.Id,
		Name:        tabInfo.Name,
		Sorter:      tabInfo.Sorter,
		CreatedTime: tabInfo.CreatedTime,
		DefaultNode: tabInfo.DefaultNode,
		HomePage:    tabInfo.HomePage,
	}
	res := object.UpdateTab(id, &tab)
	resp = Response{Status: "ok", Msg: "success", Data: res}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) DeleteTab() {
	id := c.Input().Get("id")
	memberId := c.GetSessionUsername()

	if !object.CheckModIdentity(memberId) {
		resp := Response{Status: "fail", Msg: "Unauthorized."}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	resp := Response{Status: "ok", Msg: "success", Data: object.DeleteTab(id)}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetTabWithNodes() {
	id := c.Input().Get("id")

	if len(id) == 0 {
		id = object.GetDefaultTab()
	}

	tabInfo := object.GetTab(id)
	nodes := object.GetNodesByTab(id)
	resp := Response{Status: "ok", Msg: "success", Data: tabInfo, Data2: nodes}

	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetTabNodes() {
	id := c.Input().Get("id")

	if len(id) == 0 {
		id = object.GetDefaultTab()
	}

	c.Data["json"] = object.GetNodesByTab(id)
	c.ServeJSON()
}
