// Copyright 2024 The Casibase Authors. All Rights Reserved.
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

	"github.com/beego/beego/utils/pagination"
	"github.com/casibase/casibase/object"
	"github.com/casibase/casibase/util"
)

// GetConnections
// @Title GetConnections
// @Tag Connection API
// @Description get all connections
// @Param   pageSize     query    string  true        "The size of each page"
// @Param   p     query    string  true        "The number of the page"
// @Success 200 {object} object.Connection The Response object
// @router /get-connections [get]
func (c *ApiController) GetConnections() {
	owner := c.Input().Get("owner")
	limit := c.Input().Get("pageSize")
	page := c.Input().Get("p")
	field := c.Input().Get("field")
	value := c.Input().Get("value")
	sortField := c.Input().Get("sortField")
	sortOrder := c.Input().Get("sortOrder")
	status := c.Input().Get("status")

	if limit == "" || page == "" {
		connections, err := object.GetConnections(owner)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(connections)
	} else {
		limit := util.ParseInt(limit)

		count, err := object.GetConnectionCount(owner, status, field, value)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		paginator := pagination.SetPaginator(c.Ctx, limit, count)
		connections, err := object.GetPaginationConnections(owner, status, paginator.Offset(), limit, field, value, sortField, sortOrder)
		if err != nil {
			c.ResponseError(err.Error())
			return
		}

		c.ResponseOk(connections, paginator.Nums())
	}
}

// GetConnection
// @Title GetConnection
// @Tag Connection API
// @Description get connection
// @Param   id     query    string  true        "The id of connection"
// @Success 200 {object} object.Connection
// @router /get-connection [get]
func (c *ApiController) GetConnection() {
	id := c.Input().Get("id")

	connection, err := object.GetConnection(id)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk(connection)
}

// DeleteConnection
// @Title DeleteConnection
// @Tag Connection API
// @Description delete connection
// @Param   id     query    string  true        "The id of connection"
// @Success 200 {object} Response
// @router /delete-connection [post]
func (c *ApiController) DeleteConnection() {
	var connection object.Connection
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &connection)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	affected, err := object.DeleteConnection(&connection)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(affected)
	c.ServeJSON()
}

// UpdateConnection
// @Title UpdateConnection
// @Tag Connection API
// @Description update connection
// @Param   id     query    string  true        "The id of connection"
// @Param   body    body   object.Connection true "The connection object"
// @Success 200 {object} Response
// @router /update-connection [post]
func (c *ApiController) UpdateConnection() {
	id := c.Input().Get("id")

	var connection object.Connection
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &connection)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.UpdateConnection(id, &connection))
	c.ServeJSON()
}

// AddConnection
// @Title AddConnection
// @Tag Connection API
// @Description add connection
// @Param   body    body   object.Connection true "The connection object"
// @Success 200 {object} Response
// @router /add-connection [post]
func (c *ApiController) AddConnection() {
	var connection object.Connection
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &connection)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.Data["json"] = wrapActionResponse(object.AddConnection(&connection))
	c.ServeJSON()
}

// StartConnection
// @Title StartConnection
// @Tag Connection API
// @Description start connection
// @Param   id     query    string  true        "The id of connection"
// @Success 200 {object} Response
// @router /start-connection [post]
func (c *ApiController) StartConnection() {
	connectionId := c.Input().Get("id")

	connection := &object.Connection{
		Status:    object.Connected,
		StartTime: util.GetCurrentTime(),
	}

	_, err := object.UpdateConnection(connectionId, connection, []string{"status", "start_time"}...)
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk()
}

// StopConnection
// @Title StopConnection
// @Tag Connection API
// @Description stop connection
// @Param   id     query    string  true        "The id of connection"
// @Success 200 {object} Response
// @router /stop-connection [post]
func (c *ApiController) StopConnection() {
	connectionId := c.Input().Get("id")

	err := object.CloseConnection(connectionId, ForcedDisconnect, "The administrator forcibly closes the session")
	if err != nil {
		c.ResponseError(err.Error())
		return
	}

	c.ResponseOk()
}
