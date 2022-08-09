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

// @router /get-tabs [get]
// @Title GetTabs
// @Tag Tab API
func (c *ApiController) GetTabs() {
	c.Data["json"] = object.GetHomePageTabs()
	c.ServeJSON()
}

// @router /get-all-tabs [get]
// @Title GetAllTabs
// @Tag Tab API
func (c *ApiController) GetAllTabs() {
	c.Data["json"] = object.GetAllTabs()
	c.ServeJSON()
}

// @router /get-tabs-admin [get]
// @Title GetAllTabsAdmin
// @Tag Tab API
func (c *ApiController) GetAllTabsAdmin() {
	c.Data["json"] = object.GetAllTabsAdmin()
	c.ServeJSON()
}

// @router /get-tabs-admin [get]
// @Title GetTabAdmin
// @Tag Tab API
func (c *ApiController) GetTabAdmin() {
	id := c.Input().Get("id")

	c.Data["json"] = object.GetTabAdmin(id)
	c.ServeJSON()
}

// @router /get-tabs-admin [get]
// @Title AddTab
// @Tag Tab API
func (c *ApiController) AddTab() {
	if c.RequireAdmin() {
		return
	}

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
	c.ResponseOk(res)
}

// @router /update-tab [post]
// @Title UpdateTab
// @Tag Tab API
func (c *ApiController) UpdateTab() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")

	var tabInfo object.AdminTabInfo

	err := json.Unmarshal(c.Ctx.Input.RequestBody, &tabInfo)
	if err != nil {
		panic(err)
	}

	tab := object.Tab{
		// Id:          tabInfo.Id,
		Name:        tabInfo.Name,
		Sorter:      tabInfo.Sorter,
		CreatedTime: tabInfo.CreatedTime,
		DefaultNode: tabInfo.DefaultNode,
		HomePage:    tabInfo.HomePage,
	}
	res := object.UpdateTab(id, &tab)
	c.ResponseOk(res)
}

// @router /delete-tab [post]
// @Title DeleteTab
// @Tag Tab API
func (c *ApiController) DeleteTab() {
	if c.RequireAdmin() {
		return
	}

	id := c.Input().Get("id")
	resp := Response{Status: "ok", Msg: "success", Data: object.DeleteTab(id)}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @router /get-tab-with-nodes [get]
// @Title GetTabWithNodes
// @Tag Tab API
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
